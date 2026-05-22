from fastapi import APIRouter, Depends

from rinku.users.schemas import UserSchema
from rinku.models import User
from rinku.auth.models import RequestContext
from rinku.auth.middlewares import authenticate_request

router = APIRouter()

@router.get("/user", response_model=UserSchema)
async def authenticated_user(context: RequestContext = Depends(authenticate_request)) -> User:
  """
  Gets the authenticated user.
  """

  return context.user
