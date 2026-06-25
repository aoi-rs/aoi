from sqlalchemy import select, Select

from aoi.kit.repository import (
    RepositoryBase,
)
from aoi.models import PersonalAccessToken
from aoi.auth.models import AuthContext


class PersonalAccessTokenRepository(
    RepositoryBase[PersonalAccessToken],
):
    model = PersonalAccessToken

    def get_base_statement(
        self, *, include_revoked: bool = False
    ) -> Select[tuple[PersonalAccessToken]]:
        statement = select(self.model)

        if not include_revoked:
            statement = statement.where(self.model.revoked_at.is_(None))

        return statement

    def get_readable_statement(
        self, context: AuthContext
    ) -> Select[tuple[PersonalAccessToken]]:
        statement = self.get_base_statement().where(
            self.model.user_id == context.user.id
        )

        return statement

    async def get_by_token_hash(self, token_hash: str) -> PersonalAccessToken | None:
        statement = self.get_base_statement().where(self.model.token_hash == token_hash)
        return await self.get_one_or_none(statement)
