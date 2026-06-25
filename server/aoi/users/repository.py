from uuid import UUID

from aoi.kit.repository import RepositoryBase, RepositoryIDMixin
from aoi.models import User


class UserRepository(RepositoryBase[User], RepositoryIDMixin[User, UUID]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        statement = self.get_base_statement().where(User.email == email)
        return await self.get_one_or_none(statement)
