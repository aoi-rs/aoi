import uuid

from fastapi.routing import APIRouter
from fastapi.responses import RedirectResponse, Response
from fastapi import Depends, Request
from httpx_oauth.integrations.fastapi import OAuth2AuthorizeCallback
from httpx_oauth.oauth2 import OAuth2Token
from typing import Any

from rinku.postgres import AsyncSession, get_db_session
from rinku.kit.http import ReturnTo, get_safe_return_url
from rinku.redis import Redis, get_redis
from rinku.auth.service import auth as auth_service
from rinku.auth.models import RequestContext
from rinku.auth.middlewares import authenticate_request
from rinku.sessions.service import sessions
from rinku.kit.crypto import RefreshToken

from rinku.kit.oauth import (
    OAuthCallbackError,
    clear_login_cookie,
    create_authorization_response,
    validate_callback,
)

from .service import GoogleServiceError, google_oauth_client, google as google_service

oauth2_login_authorize_callback = OAuth2AuthorizeCallback(
    google_oauth_client, route_name="integrations.google.login.callback"
)

GOOGLE_OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
]


async def create_google_authorization_response(
    request: Request, redis: Redis, state: dict[str, Any], callback_route: str
) -> RedirectResponse:
    return await create_authorization_response(
        request=request,
        redis=redis,
        state=state,
        callback_route=callback_route,
        oauth_client=google_oauth_client,
        scopes=GOOGLE_OAUTH_SCOPES,
        type="google",
    )


router = APIRouter(prefix="/integrations/google")


@router.get("/login/authorize", name="integrations.google.login.authorize")
async def login_authorize(
    request: Request, return_to: ReturnTo, redis: Redis = Depends(get_redis)
):
    state: dict[str, Any] = {"return_to": return_to}

    return await create_google_authorization_response(
        request, redis, state, "integrations.google.login.callback"
    )


@router.get("/login/callback", name="integrations.google.login.callback")
async def login_callback(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    access_token_state: tuple[OAuth2Token, str | None] = Depends(
        oauth2_login_authorize_callback
    ),
    redis: Redis = Depends(get_redis),
) -> Response:
    token_data, state = access_token_state

    state_data = await validate_callback(
        request, redis, token_data, state, type="google"
    )

    return_to = state_data.get("return_to")

    try:
        user, _was_created = await google_service.get_updated_or_create(
            session,
            token=token_data,
        )
    except GoogleServiceError as e:
        raise OAuthCallbackError(e.message, e.status_code, return_to=return_to) from e

    user_session, refresh_token_hmac_key = await sessions.create(request, session, user)

    refresh_token = RefreshToken(
        version=0,
        session_id=user_session.id,
        counter=user_session.refresh_token_counter,
    ).encode(refresh_token_hmac_key)

    response = await auth_service.create_login_response(
        request,
        user,
        user_session,
        refresh_token=refresh_token,
        return_to=return_to,
    )

    clear_login_cookie(request, response)

    return response


@router.get("/link/authorize", name="integrations.google.link.authorize")
async def link_authorize(
    request: Request,
    return_to: ReturnTo,
    context: RequestContext = Depends(authenticate_request),
    redis: Redis = Depends(get_redis),
) -> RedirectResponse:
    state: dict[str, Any] = {"return_to": return_to, "user_id": context.user.id}

    return await create_google_authorization_response(
        request, redis, state, "integrations.google.link.callback"
    )


@router.get("/callback", name="integrations.google.link.callback")
async def link_callback(
    request: Request,
    context: RequestContext = Depends(authenticate_request),
    session: AsyncSession = Depends(get_db_session),
    access_token_state: tuple[OAuth2Token, str | None] = Depends(
        oauth2_login_authorize_callback
    ),
    redis: Redis = Depends(get_redis),
):
    token_data, state = access_token_state
    state_data = await validate_callback(
        request, redis, token_data, state, type="google"
    )

    return_to = state_data.get("return_to")
    state_user_id = state_data.get("user_id")

    if state_user_id is None or context.user.id != uuid.UUID(state_user_id):
        raise OAuthCallbackError("Invalid user for linking", return_to=return_to)

    try:
        await google_service.link_user(session, user=context.user, token=token_data)
    except GoogleServiceError as e:
        raise OAuthCallbackError(e.message, e.status_code, return_to=return_to) from e

    return_url = get_safe_return_url(return_to)
    response = RedirectResponse(return_url, 303)

    clear_login_cookie(request, response)

    return response
