from sqlalchemy import Select, delete
from uuid import UUID

from aoi.kit.repository import RepositoryBase, Options
from aoi.auth.models import AuthContext
from aoi.models import Session


class SessionRepository(RepositoryBase[Session]):
    model = Session

    def get_readable_statement(
        self, auth_context: AuthContext
    ) -> Select[tuple[Session]]:
        statement = self.get_base_statement().where(
            Session.user_id == auth_context.user.id
        )

        return statement

    async def revoke(self, session_id: UUID):
        statement = delete(self.model).where(self.model.id == session_id)
        return await self.session.execute(statement)

    async def revoke_user_sessions(self, user: UUID, exclude_session_id: UUID):
        statement = delete(self.model).where(
            self.model.user_id == user, self.model.id != exclude_session_id
        )

        return await self.session.execute(statement)

    async def get_by_id_for_update(
        self, session_id: UUID, *, nowait: bool = True, options: Options = ()
    ) -> Session:
        """
        Get session by ID with FOR UPDATE lock.

        Uses FOR UPDATE OF sessions to lock only the session row, allowing
        LEFT OUTER JOINs for eager loading of relationships.

        See: https://www.postgresql.org/docs/current/explicit-locking.html
        """

        statement = (
            self.get_base_statement()
            .where(Session.id == session_id)
            .options(*options)
            .with_for_update(nowait=nowait, of=Session)
        )

        return await self.get_one(statement)
