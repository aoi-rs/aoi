from fastapi import Depends, Request
from fastapi.routing import APIRouter

from rinku.login_tokens.schemas import LoginTokenRequest, LoginTokenCheck
from rinku.postgres import get_db_session
from rinku.kit.db.postgres import AsyncSession
from rinku.kit.http import ReturnTo
from rinku.login_tokens.service import login_tokens

router = APIRouter(prefix="/login_tokens")

@router.post("/request", status_code=202)
async def request_login_token(request: LoginTokenRequest, session: AsyncSession = Depends(get_db_session)):
  """
  Requests a login token.
  """

  await login_tokens.request(session, request.email)

@router.post("/check")
async def check_login_token(
  request: Request, 
  return_to: ReturnTo,
  data: LoginTokenCheck, 
  session: AsyncSession = Depends(get_db_session)
):
  """
  Checks a login token and authenticates the user if valid.
  """

  return await login_tokens.check(
    session, 
    request,
    return_to=return_to,
    login_token_id=data.login_token_id, 
    email=data.email, 
    token=data.token
  )
