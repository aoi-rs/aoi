from uuid import UUID
from sqlalchemy import update

from aoi.models import User
from aoi.kit.db.postgres import AsyncSession
from aoi.users.schemas import UserUpdate
from aoi.users.repository import UserRepository


class UserService:
    async def get(self, session: AsyncSession, id: UUID) -> User | None:
        repository = UserRepository.from_session(session)
        user = await repository.get_by_id(id)

        return user

    async def get_or_create(self, session: AsyncSession, email: str) -> User:
        repository = UserRepository.from_session(session)
        return await repository.get_or_create(email=email)

    async def update(self, id: UUID, session: AsyncSession, update_schema: UserUpdate):
        statement = (
            update(User)
            .where(User.id == id)
            .values(**update_schema.model_dump(exclude_unset=True))
            .returning(User)
        )

        result = await session.execute(statement)
        user = result.unique().scalar_one()

        return user


users = UserService()
