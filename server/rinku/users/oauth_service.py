from sqlalchemy import select
from rinku.postgres import AsyncSession
from rinku.models.user import OAuthPlatform, OAuthAccount


class OAuthAccountService:
    async def get_by_platform_and_account_id(
        self, session: AsyncSession, platform: OAuthPlatform, account_id: str
    ) -> OAuthAccount | None:
        statement = select(OAuthAccount).where(
            OAuthAccount.platform == platform, OAuthAccount.account_id == account_id
        )

        result = await session.execute(statement)
        return result.scalar_one_or_none()


oauth_accounts = OAuthAccountService()
