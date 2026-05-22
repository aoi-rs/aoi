from rinku.kit.repository import RepositoryBase
from rinku.models import User, OAuthAccount
from rinku.models.user import OAuthPlatform

class UserRepository(RepositoryBase[User]):
  model = User

  async def get_by_email(self, email: str) -> User | None:
    statement = self.get_base_statement().where(User.email == email)
    return await self.get_one_or_none(statement)

  async def get_by_oauth_account(
    self,
    platform: OAuthPlatform,
    account_id: str,
  ) -> User | None:
    statement = (
      self.get_base_statement()
      .join(User.oauth_accounts)
      .where(
        OAuthAccount.platform == platform,
        OAuthAccount.account_id == account_id, 
      )
    )

    return await self.get_one_or_none(statement)