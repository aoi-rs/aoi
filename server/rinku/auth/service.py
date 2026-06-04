from fastapi import Request, Response
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
from typing import TypeVar
from uuid import UUID
from jwt import encode, decode, DecodeError

from rinku.models import User, Session
from rinku.kit.utils import utc_now
from rinku.kit.http import get_safe_return_url
from rinku.config import settings
from rinku.auth.models import SessionRef

R = TypeVar("R", bound=Response)


class AuthService:
    async def create_login_response(
        self,
        request: Request,
        user: User,
        user_session: Session,
        refresh_token: str,
        *,
        return_to: str | None = None,
        redirect: bool = True,
    ) -> Response:
        expires_at = utc_now() + timedelta(hours=1)

        access_token = encode(
            {
                "sub": str(user.id),
                "session_id": str(user_session.id),
                "exp": expires_at,
            },
            settings.JWT_PRIVATE_KEY,
            algorithm="HS256",
        )

        return_url = get_safe_return_url(return_to)

        response = RedirectResponse(return_url, 303) if redirect else Response()

        response = self._set_cookie(
            request,
            response,
            key=settings.ACCESS_TOKEN_COOKIE_KEY,
            value=access_token,
            expires=expires_at,
        )

        response = self._set_cookie(
            request,
            response,
            key=settings.REFRESH_TOKEN_COOKIE_KEY,
            value=refresh_token,
            expires=utc_now() + timedelta(days=31),
        )

        return response

    def _set_cookie(
        self,
        request: Request,
        response: R,
        key: str,
        value: str,
        expires: int | datetime,
    ) -> R:
        is_localhost = request.url.hostname in {"127.0.0.1", "localhost"}
        secure = not is_localhost

        response.set_cookie(
            key,
            value=value,
            expires=expires,
            path="/",
            domain=settings.SESSION_COOKIE_DOMAIN,
            secure=secure,
            httponly=True,
            samesite="lax",
        )

        return response

    def authenticate(self, request: Request) -> SessionRef | None:
        token = request.cookies.get(settings.ACCESS_TOKEN_COOKIE_KEY)

        if token is None:
            return None

        try:
            claims = decode(token, settings.JWT_PRIVATE_KEY, algorithms=["HS256"])
        except DecodeError:
            return None

        user_id = UUID(claims["sub"])
        session_id = UUID(claims["session_id"])

        return SessionRef(session_id, user_id)


auth = AuthService()
