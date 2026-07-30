from aoi.state.schemas import DownloadedUser
from aoi.postgres import AsyncSession
from aoi.auth.dependencies import AuthContext
from aoi.users.repository import UserRepository


class StateService:
    async def download(
        self, session: AsyncSession, auth_context: AuthContext
    ) -> list[DownloadedUser]:
        repository = UserRepository.from_session(session)
        user = await repository.get_by_id(auth_context.user.id)

        if not user:
            raise

        return [DownloadedUser.model_validate(user)]

    async def refresh(
        self, session: AsyncSession, auth_context: AuthContext, from_revision: int
    ) -> list[DownloadedUser]:
        repository = UserRepository.from_session(session)
        user = await repository.get_by_id(auth_context.user.id)

        if not user or user.revision <= from_revision:
            return []

        return [DownloadedUser.model_validate(user)]


state = StateService()
