import jwt
import uuid
import base64
import asyncio
import random

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.exc import DBAPIError
from collections.abc import Sequence
from jwt.exceptions import InvalidTokenError

from rinku.kit.db.postgres import AsyncSession
from rinku.kit.db.locking import is_lock_not_available_error
from rinku.kit.pagination import PaginationParams
from rinku.kit.utils import utc_now
from rinku.models import Session, User
from rinku.config import settings
from rinku.auth.models import RequestContext
from rinku.sessions.repository import SessionRepository
from rinku.sessions.schemas import SessionRefresh
from rinku.exceptions import ResourceMissing, RinkuError
from rinku.auth.service import auth as auth_service

from rinku.kit.crypto import (
  RefreshToken, 
  parse_refresh_token, 
  RefreshTokenParseError, 
  generate_refresh_token_hmac_key
)

class SessionMissingError(ResourceMissing):
  def __init__(self):
    super().__init__("This session could not be found")


class SessionRevokedError(RinkuError):
  def __init__(self):
    super().__init__("This session was revoked", status_code=400)


class TooManyConcurrentRefreshesError(RinkuError):
  def __init__(self):
    super().__init__(
      "Too many concurrent token refresh requests on the same session", 
      status_code=409
    )


class RefreshTokenAlreadyUsedError(RinkuError):
  def __init__(self):
    super().__init__("Refresh token already used", status_code=400)


SESSION_REFRESH_RETRY_LOOP_DURATION = 5


class SessionService:
  async def list(self, session: AsyncSession, context: RequestContext, pagination: PaginationParams) -> tuple[Sequence[Session], int]:
    repository = SessionRepository.from_session(session)
    statement = select(Session).where(Session.user_id == context.user.id, Session.revoked.is_(False))

    items, count = await repository.paginate(statement, limit=pagination.limit)

    return items, count
  
  async def get(self, session: AsyncSession, context: RequestContext, id: uuid.UUID) -> Session | None:
    repository = SessionRepository.from_session(session)
    statement = repository.get_readable_statement(context).where(Session.id == id)

    return await repository.get_one_or_none(statement)

  async def revoke(self, session: AsyncSession, context: RequestContext, user_session: Session) -> Session:
    repository = SessionRepository.from_session(session)
    return await repository.update(user_session, update_dict={"revoked": True})


  async def create(self, request: Request, session: AsyncSession, user: User) -> tuple[Session, bytes]:
    refresh_token_hmac_key = generate_refresh_token_hmac_key()

    user_session = Session(
      user=user,
      user_agent=request.headers.get("user-agent", ""),
      refresh_token_hmac_key=base64.urlsafe_b64encode(refresh_token_hmac_key).decode(),
    )

    session.add(user_session)
    await session.flush()

    return (user_session, refresh_token_hmac_key)

  
  async def refresh(self, request: Request, session: AsyncSession, params: SessionRefresh):
    repository = SessionRepository.from_session(session)

    # A 5 second retry loop is used to make sure that refresh token
    # requests do not waste database connections waiting for each other.
    # Instead of waiting at the database level, they're waiting at the API
    # level instead and retry to refresh the locked row every 10-30
    # milliseconds.
    retry_start = utc_now()

    while (utc_now() - retry_start).total_seconds() < SESSION_REFRESH_RETRY_LOOP_DURATION:
      try:
        refresh_token = parse_refresh_token(params.refresh_token)
      except RefreshTokenParseError as e:
        raise SessionMissingError() from e

      statement = repository.get_base_statement().where(Session.id == refresh_token.session_id)
      user_session = await repository.get_one_or_none(statement)

      if user_session is None:
        raise SessionMissingError()
      
      refresh_token_hmac_key = (
        base64.urlsafe_b64decode(user_session.refresh_token_hmac_key)
      )

      if not refresh_token.check_signature(refresh_token_hmac_key):
        raise SessionMissingError()
      
      if user_session.revoked:
        raise SessionRevokedError()
      
      # Basic checks above passed, now we need to serialize access
		  # to the session in a transaction so that there's no
		  # concurrent modification. In the event that the session's 
      # row is locked, the transaction is closed and the whole 
      # process will be retried a bit later so that the connection 
      # pool does not get exhausted.

      try:
        locked_user_session = await repository.get_by_id_for_update(
          user_session.id,
          nowait=True,
        )
      except DBAPIError as e:
        if is_lock_not_available_error(e):
          await asyncio.sleep(random.uniform(0.01, 0.03))
          continue

      # TODO: check if it should tie sessions to OAuth Clients and 
      # enforce consistency here.

      counter_difference = (
        locked_user_session.refresh_token_counter 
        - refresh_token.counter
      )


      if counter_difference < 0:
        raise RinkuError("This refresh token was not issued by this server", status_code=400)
      elif counter_difference == 0:
        # normal refresh token use
        locked_user_session.refresh_token_counter += 1

        issued_refresh_token = RefreshToken(
          version=0,
          session_id=locked_user_session.id,
          counter=locked_user_session.refresh_token_counter
        ).encode(refresh_token_hmac_key)
      elif counter_difference > 0:
        # refresh token is being reused

        # This is caused when the client has
				# failed to receive or save the
				# response from the last refresh token
				# requests. This occurs more
				# frequently than you can imagine, so
				# it's an allowed reuse.
        likely_not_saved_by_client = counter_difference == 1

        # Concurrent refreshes occur when the
				# client sends off multiple refresh
				# token requests at once or close by.
				# Often this happens when your browser
				# remembers multiple tabs of the app,
				# which were paused by it or by the OS
				# (such as you quitting the browser)
				# and then opening it back up. If the
			  # app uses SSR it is likely that the N
				# open tabs will immediately send a
				# request to the app's hosting server,
				# which will attempt to concurrently
				# refresh the session at once using
				# refresh token.
        likely_concurrent_refreshes = (
          abs((retry_start - user_session.refreshed_at).total_seconds())
          < settings.REFRESH_TOKEN_REUSE_INTERVAL_SECONDS
        )

        reuse_allowed = likely_not_saved_by_client or likely_concurrent_refreshes

        if reuse_allowed:
          # When reuse is allowed, we do
					# not increment the counter.
					# This allows all of the
					# concurrent clients to
					# synchronize their state
					# within the refresh token
					# reuse interval to the
					# currently active refresh
					# token.

          issued_refresh_token = RefreshToken(
            version=0,
            session_id=locked_user_session.id,
            counter=locked_user_session.refresh_token_counter
          ).encode(refresh_token_hmac_key)
        elif settings.REFRESH_TOKEN_ROTATION_ENABLED:
          # Reuse is not allowed, in
					# which case the whole session
					# must go preventing any
					# client with any refresh and
					# access token for this
					# session from being used.
          locked_user_session.revoked = True

          await session.flush()
          await session.commit()

          raise RefreshTokenAlreadyUsedError()
        else:
          # Reuse is not allowed, but no
					# refresh token rotation
					# enabled. So only fail this
					# request.

          await session.flush()
          await session.commit()

          raise RefreshTokenAlreadyUsedError()
      
      user_session.refreshed_at = utc_now()
      user_session.user_agent = request.headers.get("user_agent", "")

      return await auth_service.create_login_response(
        request, 
        user=user_session.user, 
        user_session=user_session, 
        refresh_token=issued_refresh_token, 
        redirect=False
      )

    raise TooManyConcurrentRefreshesError()


  async def resolve_from_request(self, request: Request, session: AsyncSession) -> Session | None:
    token = request.cookies.get(settings.ACCESS_TOKEN_COOKIE_KEY)

    if token is None:
      return None
    
    try:
      claims = jwt.decode(token, settings.JWT_PRIVATE_KEY, algorithms="HS256")
    except InvalidTokenError:
      return None

    repository = SessionRepository.from_session(session)
    statement = repository.get_base_statement().where(Session.id == claims["session_id"])

    user_session = await repository.get_one_or_none(statement)

    return user_session

  
sessions = SessionService()
