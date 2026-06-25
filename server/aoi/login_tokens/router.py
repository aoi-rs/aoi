from fastapi import Depends, Request, Form
from fastapi.routing import APIRouter
from pydantic import EmailStr

from aoi.login_tokens.schemas import LoginTokenRequest
from aoi.postgres import get_db_session
from aoi.kit.db.postgres import AsyncSession
from aoi.kit.http import ReturnTo
from aoi.login_tokens.service import login_tokens

router = APIRouter(prefix="/login_tokens")


@router.post("/request", status_code=202)
async def request(
    request: LoginTokenRequest, session: AsyncSession = Depends(get_db_session)
):
    """
    Requests a login token.
    """

    await login_tokens.request(session, request.email)


@router.post("/check")
async def check(
    request: Request,
    return_to: ReturnTo,
    email: EmailStr,
    token: str = Form(),
    session: AsyncSession = Depends(get_db_session),
):
    """
    Checks a login token and authenticates the user if valid.
    """

    return await login_tokens.check(
        session,
        request,
        return_to=return_to,
        email=email,
        token=token,
    )
