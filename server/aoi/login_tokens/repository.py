from aoi.kit.repository import RepositoryBase
from aoi.kit.utils import utc_now
from aoi.models import LoginToken


class LoginTokenRepository(RepositoryBase[LoginToken]):
    model = LoginToken

    async def get_by_token_for_update(self, token_hash: str, email: str):
        statement = (
            self.get_base_statement()
            .where(
                LoginToken.token_hash == token_hash,
                LoginToken.email == email,
                LoginToken.expires_at > utc_now(),
                LoginToken.was_used.is_(False),
            )
            .with_for_update(of=LoginToken, nowait=True)
        )

        return await self.get_one_or_none(statement)
