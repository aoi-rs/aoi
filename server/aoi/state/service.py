from typing import Any, AsyncGenerator

from sqlalchemy import Row, text

from aoi.auth.dependencies import AuthContext
from aoi.postgres import AsyncSession
from aoi.state.schemas import (
    Delta,
    Metadata,
    MetadataFields,
    PersonalAccessTokenDelta,
    SessionDelta,
    UserDelta,
)

MODEL_SCHEMAS: dict[str, type[Delta]] = {
    "user": UserDelta,
    "session": SessionDelta,
    "personal_access_token": PersonalAccessTokenDelta,
}


class StateService:
    async def download(
        self, session: AsyncSession, auth_context: AuthContext
    ) -> AsyncGenerator[Delta]:
        result = await session.stream(
            text("""
                SELECT
                    u.id,
                    'user' AS model,
                    u.revision,
                    jsonb_build_object(
                        'email', u.email,
                        'name', u.name
                    ) AS data
                FROM users u
                WHERE u.id = :user_id

                UNION ALL

                SELECT
                    s.id,
                    'session' AS model,
                    s.revision,
                    jsonb_build_object(
                        'user_agent', s.user_agent,
                        'refreshed_at', s.refreshed_at
                    ) AS data
                FROM sessions s
                WHERE s.user_id = :user_id
                AND s.revoked = false

                UNION ALL

                SELECT
                    t.id,
                    'personal_access_token' AS model,
                    t.revision,
                    jsonb_build_object(
                        'name', t.name,
                        'permissions', t.permissions,
                        'expires_at', t.expires_at,
                        'created_at', t.created_at,
                        'modified_at', t.modified_at
                    ) AS data
                    FROM personal_access_tokens t
                    WHERE t.user_id = :user_id
            """),
            {
                "user_id": auth_context.user.id,
            },
        )

        last_revision = 0

        async for row in result:
            last_revision = max(last_revision, row.revision)
            yield self._row_to_delta(row)

        if last_revision > 0:
            metadata_fields = MetadataFields(last_revision=last_revision)
            metadata = Metadata(_metadata=metadata_fields)

            yield metadata

    def _row_to_delta(self, row: Row[Any]) -> Delta:
        schema = MODEL_SCHEMAS[row.model]
        return schema(**row.data)

    async def refresh(
        self, session: AsyncSession, auth_context: AuthContext, from_revision: int
    ) -> AsyncGenerator[Any]:
        result = await session.stream(
            text("""
                SELECT
                    u.id,
                    'user' AS model,
                    u.revision,
                    jsonb_build_object(
                        'email', u.email,
                        'name', u.name
                    ) AS data
                FROM users u
                WHERE u.id = :user_id AND u.revision > :from_revision
        
                UNION ALL
        
                SELECT
                    s.id,
                    'session' AS model,
                    s.revision,
                    jsonb_build_object(
                        'user_agent', s.user_agent,
                        'refreshed_at', s.refreshed_at
                    ) AS data
                FROM sessions s
                WHERE s.user_id = :user_id
                AND s.revoked = false
                AND s.revision > :from_revision

                UNION ALL

                SELECT
                    t.id,
                    'personal_access_token' AS model,
                    t.revision,
                    jsonb_build_object(
                        'name', t.name,
                        'permissions', t.permissions,
                        'expires_at', t.expires_at,
                        'created_at', t.created_at,
                        'modified_at', t.modified_at
                    ) AS data
                FROM personal_access_tokens t
                WHERE t.user_id = :user_id 
                AND t.revoked_at is null
                AND t.revision > :from_revision
            """),
            {"user_id": auth_context.user.id, "from_revision": from_revision},
        )

        last_revision = 0

        async for row in result:
            last_revision = max(last_revision, row.revision)

            yield {
                "id": str(row.id),
                "_model": str(row.model),
                **row.data,
            }

        if last_revision > 0:
            yield {"_metadata": {"last_revision": last_revision}}


state = StateService()
