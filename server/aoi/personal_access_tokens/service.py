from uuid import UUID
from collections.abc import Sequence

from aoi.kit.crypto import generate_token, generate_token_hash
from aoi.kit.pagination import PaginationParams
from aoi.kit.utils import utc_now
from aoi.config import settings
from aoi.auth.models import AuthContext
from aoi.postgres import AsyncSession
from aoi.models import PersonalAccessToken

from .schemas import PersonalAccessTokenCreate, PersonalAccessTokenUpdate
from .repository import PersonalAccessTokenRepository

TOKEN_PREFIX = "aoi_"


class PersonalAccessTokenService:
    async def list(
        self,
        session: AsyncSession,
        context: AuthContext,
        pagination: PaginationParams,
    ) -> tuple[Sequence[PersonalAccessToken], int]:
        repository = PersonalAccessTokenRepository.from_session(session)
        statement = repository.get_readable_statement(context)

        return await repository.paginate(statement, limit=pagination.limit)

    async def get(
        self, session: AsyncSession, context: AuthContext, id: UUID
    ) -> PersonalAccessToken | None:
        repository = PersonalAccessTokenRepository.from_session(session)

        statement = repository.get_readable_statement(context).where(
            PersonalAccessToken.id == id
        )

        return await repository.get_one_or_none(statement)

    async def get_by_token(
        self, session: AsyncSession, token: str
    ) -> PersonalAccessToken | None:
        repository = PersonalAccessTokenRepository.from_session(session)
        token_hash = generate_token_hash(token, secret=settings.SECRET)

        return await repository.get_by_token_hash(token_hash)

    async def create(
        self,
        session: AsyncSession,
        context: AuthContext,
        create_schema: PersonalAccessTokenCreate,
    ) -> tuple[PersonalAccessToken, str]:
        repository = PersonalAccessTokenRepository.from_session(session)

        token = generate_token(prefix=TOKEN_PREFIX)
        token_hash = generate_token_hash(token, secret=settings.SECRET)

        expires_at = (
            utc_now() + create_schema.expires_in if create_schema.expires_in else None
        )

        personal_access_token = PersonalAccessToken(
            token_hash=token_hash,
            permissions=create_schema.permissions,
            name=create_schema.name,
            expires_at=expires_at,
            user_id=context.user.id,
        )

        personal_access_token = await repository.create(
            personal_access_token, flush=True
        )

        return personal_access_token, token

    async def update(
        self,
        session: AsyncSession,
        personal_access_token: PersonalAccessToken,
        update_schema: PersonalAccessTokenUpdate,
    ) -> PersonalAccessToken:
        repository = PersonalAccessTokenRepository.from_session(session)

        return await repository.update(
            personal_access_token,
            update_dict=update_schema.model_dump(exclude_unset=True),
        )

    async def revoke(
        self, session: AsyncSession, personal_access_token: PersonalAccessToken
    ):
        repository = PersonalAccessTokenRepository.from_session(session)

        return await repository.update(
            personal_access_token, update_dict={"revoked_at": utc_now()}
        )


personal_access_tokens = PersonalAccessTokenService()
