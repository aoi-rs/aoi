from fastapi import APIRouter, Depends

from rinku.users.schemas import UserSchema, UserUpdate
from rinku.users.auth import UserRead, UserWrite
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


@router.patch("/user", response_model=UserSchema)
async def update_user(
    auth_context: UserWrite,
    user_update: UserUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> UserSchema:
    """
    Updates the authenticated user.
    """

    user = await users.update(auth_context.user.id, session, user_update)

    return UserSchema.model_validate(user)
