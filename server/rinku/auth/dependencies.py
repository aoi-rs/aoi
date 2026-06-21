from fastapi import Request, Depends
from fastapi.security.utils import get_authorization_scheme_param
from typing import Annotated

from rinku.exceptions import Unauthorized, Forbidden
from rinku.postgres import AsyncSession, get_db_session

from rinku.personal_access_tokens.service import (
    personal_access_tokens,
    TOKEN_PREFIX as PERSONAL_ACCESS_TOKEN_PREFIX,
)

from .models import AuthContext
from .permission import Permission
from .service import auth as auth_service


class BadCredentialsError(Unauthorized):
    def __init__(self):
        super().__init__("Bad credentials")


class SessionRequiredError(Forbidden):
    def __init__(self):
        super().__init__("Requires an authenticated session")


async def get_personal_access_token(session: AsyncSession, token: str):
    personal_access_token = await personal_access_tokens.get_by_token(session, token)

    if personal_access_token:
        # TODO: enqueue message to record usage
        ...

    return personal_access_token


def get_bearer_token(request: Request):
    authorization = request.headers.get("Authorization")
    scheme, value = get_authorization_scheme_param(authorization)

    if not scheme or not value or scheme.lower() != "bearer":
        return None

    if not value.isascii():
        return None

    return value


class Authenticator:
    def __init__(
        self,
        *,
        required_permissions: set[Permission],
        forbid_bearer_tokens: bool = False,
    ):
        self.required_permissions = required_permissions
        self.forbid_bearer_tokens = forbid_bearer_tokens

    async def __call__(
        self, request: Request, session: AsyncSession = Depends(get_db_session)
    ) -> AuthContext:
        token = get_bearer_token(request)

        if token:
            if token.startswith(PERSONAL_ACCESS_TOKEN_PREFIX):
                personal_access_token = await get_personal_access_token(session, token)

                if not personal_access_token:
                    raise BadCredentialsError()

                if self.forbid_bearer_tokens:
                    raise SessionRequiredError()

                token_permissions = set(personal_access_token.permissions)

                if token_permissions & self.required_permissions:
                    return AuthContext(
                        personal_access_token.user_id,
                        set(personal_access_token.permissions),
                        personal_access_token,
                    )
                else:
                    raise Forbidden("Resource not accessible by personal access token")

            raise BadCredentialsError()

        session_ref = auth_service.authenticate(request)

        if session_ref:
            return AuthContext(session_ref.user_id, set(Permission), session_ref)

        raise Unauthorized()


_WebSession = Authenticator(required_permissions=set(), forbid_bearer_tokens=True)

WebSession = Annotated[AuthContext, Depends(_WebSession)]
