from sqlalchemy import Select
from uuid import UUID

from rinku.kit.repository import RepositoryBase, Options
from rinku.auth.models import AuthContext
from rinku.models import Session


class SessionRepository(RepositoryBase[Session]):
    model = Session

    def get_readable_statement(self, context: AuthContext) -> Select[tuple[Session]]:
        statement = self.get_base_statement().where(Session.user_id == context.user.id)
        return statement

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
