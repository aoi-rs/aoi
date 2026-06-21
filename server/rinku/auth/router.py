from fastapi import APIRouter, Response, Depends

from rinku.sessions.service import sessions as session_service
from rinku.auth.dependencies import WebSession
from rinku.postgres import AsyncSession, get_db_session
from rinku.config import settings

router = APIRouter(prefix="/auth")


@router.delete(
    "/logout",
    summary="Logout",
    status_code=204,
    responses={204: {"description": "Logged out."}},
)
async def logout(
    response: Response,
    auth_context: WebSession,
    session: AsyncSession = Depends(get_db_session),
):
    await session_service.revoke_current(session, auth_context)

    response.delete_cookie(settings.ACCESS_TOKEN_COOKIE_KEY)
    response.delete_cookie(settings.REFRESH_TOKEN_COOKIE_KEY)
