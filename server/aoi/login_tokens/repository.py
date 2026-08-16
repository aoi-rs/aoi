from datetime import datetime
from sqlalchemy.dialects.postgresql import insert

from aoi.kit.repository import RepositoryBase
from aoi.kit.utils import utc_now
from aoi.models import LoginToken


class LoginTokenRepository(RepositoryBase[LoginToken]):
    model = LoginToken

    async def create_or_refresh(
        self, token_hash: str, email: str, expires_at: datetime
    ):
        statement = (
            insert(self.model)
            .values(email=email, token_hash=token_hash, expires_at=expires_at)
            .on_conflict_do_update(
                index_elements=[self.model.email, self.model.token_hash],
                set_={"expires_at": expires_at},
            )
            .returning(self.model)
        )

        result = await self.session.execute(statement)
        return result.scalar_one()

    async def get_by_token_for_update(self, token_hash: str, email: str):
        statement = (
            self.get_base_statement()
            .where(
                LoginToken.token_hash == token_hash,
                LoginToken.email == email,
                LoginToken.expires_at > utc_now(),
            )
            .with_for_update(of=LoginToken, nowait=True)
        )

        return await self.get_one_or_none(statement)
