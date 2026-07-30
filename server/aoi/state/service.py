from aoi.state.schemas import DownloadedState, DownloadedUser, Metadata
from aoi.postgres import AsyncSession
from aoi.auth.dependencies import AuthContext
from aoi.users.repository import UserRepository


class StateService:
    async def download(
        self, session: AsyncSession, auth_context: AuthContext
    ) -> list[DownloadedState]:
        repository = UserRepository.from_session(session)
        user = await repository.get_by_id(auth_context.user.id)

        if not user:
            raise

        return [
            DownloadedUser.model_validate(user),
            Metadata(last_revision=user.revision),
        ]

    async def refresh(
        self, session: AsyncSession, auth_context: AuthContext, from_revision: int
    ) -> list[DownloadedState]:
        repository = UserRepository.from_session(session)
        user = await repository.get_by_id(auth_context.user.id)

        if not user:
            raise

        downloaded_state: list[DownloadedState] = []

        if user.revision > from_revision:
            downloaded_state.append(DownloadedUser.model_validate(user))

        downloaded_state.append(Metadata(last_revision=user.revision))

        return downloaded_state


state = StateService()
