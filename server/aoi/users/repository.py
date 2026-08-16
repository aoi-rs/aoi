from uuid import UUID
from sqlalchemy.dialects.postgresql import insert

from aoi.kit.repository import RepositoryBase, RepositoryIDMixin
from aoi.models import User


class UserRepository(RepositoryBase[User], RepositoryIDMixin[User, UUID]):
    model = User

    async def get_or_create(self, email: str) -> User:
        statement = (
            insert(self.model)
            .values(email=email)
            .on_conflict_do_update(
                index_elements=[self.model.email], set_={"email": email}
            )
            .returning(self.model)
        )

        result = await self.session.execute(statement)
        return result.scalar_one()
