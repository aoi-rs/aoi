import secrets
import string
import hmac
import hashlib

from datetime import timedelta
from fastapi import Request
from fastapi.responses import Response

from rinku.kit.db.postgres import AsyncSession
from rinku.kit.db.locking import DBAPIError, is_lock_not_available_error
from rinku.config import settings
from rinku.kit.utils import utc_now
from rinku.models import LoginToken
from rinku.exceptions import RinkuError
from rinku.users.service import users
from rinku.sessions.service import sessions
from rinku.kit.crypto import RefreshToken
from rinku.email.sender import email_sender
from rinku.auth.service import auth
from rinku.login_tokens.repository import LoginTokenRepository


class LoginTokenInvalidOrExpired(RinkuError):
    def __init__(self):
        super().__init__("This login token is invalid or has expired", status_code=401)


class LoginTokenService:
    async def request(self, session: AsyncSession, email: str):
        token = self._generate_token()
        token_hash = self._generate_token_hash(token)
        expires_at = utc_now() + timedelta(seconds=settings.LOGIN_TOKEN_TTL_SECONDS)

        login_token = LoginToken(
            email=email, token_hash=token_hash, expires_at=expires_at
        )

        session.add(login_token)
        await session.flush()

        # TODO: delegate it to a message queue instead of sending emails
        # during HTTP requests.
        await email_sender.send(
            to_email_addr=login_token.email,
            subject="Login to Rinku",
            html_content=f"Your one-time code is {token}",
        )

    async def check(
        self,
        session: AsyncSession,
        request: Request,
        email: str,
        token: str,
        return_to: str | None = None,
    ) -> Response:
        repository = LoginTokenRepository(session)
        token_hash = self._generate_token_hash(token)

        try:
            login_token = await repository.get_by_token_for_update(token_hash, email)
        except DBAPIError as e:
            if is_lock_not_available_error(e):
                raise LoginTokenInvalidOrExpired() from e

            raise

        if login_token is None:
            raise LoginTokenInvalidOrExpired()

        login_token.was_used = True

        session.add(login_token)
        await session.flush()

        user = await users.get_or_create(session, email)

        user_session, refresh_token_hmac_key = await sessions.create(
            request, session, user
        )

        refresh_token = RefreshToken(
            version=0,
            session_id=user_session.id,
            counter=user_session.refresh_token_counter,
        ).encode(refresh_token_hmac_key)

        return await auth.create_login_response(
            request,
            user,
            user_session,
            refresh_token=refresh_token,
            return_to=return_to,
            redirect=True,
        )

    def _generate_token(self) -> str:
        result = "".join(
            secrets.choice(string.ascii_uppercase + string.digits)
            for _ in range(settings.LOGIN_TOKEN_LENGTH)
        )

        return result

    def _generate_token_hash(self, token: str) -> str:
        result = hmac.new(
            settings.SECRET.encode("ascii"), token.encode("ascii"), hashlib.sha256
        )
        return result.hexdigest()


login_tokens = LoginTokenService()
