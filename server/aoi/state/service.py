from aoi.postgres import AsyncSession
from aoi.auth.dependencies import AuthContext

from sqlalchemy import text
from typing import AsyncGenerator, Any


class StateService:
    async def download(
        self, session: AsyncSession, auth_context: AuthContext
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

            yield {
                "id": str(row.id),
                "_model": str(row.model),
                **row.data,
            }

        if last_revision > 0:
            yield {"_metadata": {"last_revision": last_revision}}

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
