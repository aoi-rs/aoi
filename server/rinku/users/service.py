from rinku.models import User
from rinku.kit.db.postgres import AsyncSession
from rinku.users.repository import UserRepository

class UserService:
  async def get_or_create(self, session: AsyncSession, email: str) -> User:
    repository = UserRepository.from_session(session)
    user = await repository.get_by_email(email)

    if user is None:
      user = await self.create(session, email)
    
    return user
  
  async def create(self, session: AsyncSession, email: str) -> User:
    user = User(email=email)

    session.add(user)
    await session.flush()

    return user

users = UserService()
