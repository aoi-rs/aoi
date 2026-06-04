from fastapi import APIRouter, Depends

from rinku.users.schemas import UserSchema
from rinku.users.auth import UserRead
from rinku.users.service import users
from rinku.postgres import AsyncSession, get_db_session

router = APIRouter()


@router.get("/user", response_model=UserSchema)
async def authenticated_user(
    auth_context: UserRead, session: AsyncSession = Depends(get_db_session)
) -> UserSchema:
    """
    Gets the authenticated user.
    """

    user = await users.get(session, auth_context.user.id)

    if not user:
        raise

    return UserSchema.model_validate(user)
