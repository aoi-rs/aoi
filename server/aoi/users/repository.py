from uuid import UUID
from sqlalchemy import text

from aoi.kit.repository import RepositoryBase, RepositoryIDMixin
from aoi.kit.utils import utc_now
from aoi.models import User


class UserRepository(RepositoryBase[User], RepositoryIDMixin[User, UUID]):
    model = User

    async def get_or_create(self, email: str) -> User:
        statement = self.get_base_statement().from_statement(
            text("""
                SELECT *
                FROM select_or_insert_user(:id, :email, :created_at)
            """)
        )

        result = await self.session.scalars(
            statement,
            {"id": self.model.generate_id(), "email": email, "created_at": utc_now()},
        )

        return result.one()
