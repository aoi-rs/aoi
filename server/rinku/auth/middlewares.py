from starlette.types import ASGIApp, Receive, Send, Scope
from fastapi import Request

from rinku.kit.db.postgres import AsyncSession
from rinku.sessions.service import sessions
from rinku.exceptions import Unauthorized
from rinku.auth.models import RequestContext


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        session: AsyncSession = scope["state"]["async_session"]
        request: Request = Request(scope)

        user_session = await sessions.resolve_from_request(request, session)

        request_context = (
            RequestContext(user_session.user, user_session)
            if user_session is not None
            else None
        )

        scope["state"]["request_context"] = request_context

        await self.app(scope, receive, send)


async def authenticate_request(request: Request) -> RequestContext:
    context = getattr(request.state, "request_context", None)

    if context is None:
        raise Unauthorized()

    return context
