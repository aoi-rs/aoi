from typing import Any, AsyncGenerator

from sqlalchemy import Row, text

from aoi.auth.dependencies import AuthContext
from aoi.models.session import session_name_from_user_agent
from aoi.postgres import AsyncSession
from aoi.state.schemas import (
    DeletionDelta,
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
                    u.revision,
                    'user' AS model,
                    jsonb_build_object(
                        'email', u.email,
                        'name', u.name,
                        'created_at', u.created_at,
                        'modified_at', u.modified_at
                    ) AS data
                FROM users u
                WHERE u.id = :user_id

                UNION ALL

                SELECT
                    s.id,
                    s.revision,
                    'session' AS model,
                    jsonb_build_object(
                        'user_agent', s.user_agent,
                        'refreshed_at', s.refreshed_at,
                        'is_current_session', s.id = :session_id,
                        'created_at', s.created_at,
                        'modified_at', s.modified_at
                    ) AS data
                FROM sessions s
                WHERE s.user_id = :user_id

                UNION ALL

                SELECT
                    t.id,
                    t.revision,
                    'personal_access_token' AS model,
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
            {"user_id": auth_context.user.id, "session_id": auth_context.session.id},
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
        if "deleted" in row.data:
            return DeletionDelta(_model=row.model, id=row.id)

        schema = MODEL_SCHEMAS[row.model]
        fields = {"id": row.id} | row.data

        if row.model == "session":
            fields |= {"name": session_name_from_user_agent(row.data["user_agent"])}

        return schema.model_validate(fields)

    async def refresh(
        self, session: AsyncSession, auth_context: AuthContext, from_revision: int
    ) -> AsyncGenerator[Delta]:
        result = await session.stream(
            text("""
                SELECT
                    u.id,
                    'user' AS model,
                    u.revision,
                    jsonb_build_object(
                        'email', u.email,
                        'name', u.name,
                        'created_at', u.created_at,
                        'modified_at', u.modified_at
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
                        'refreshed_at', s.refreshed_at,
                        'is_current_session', s.id = :session_id,
                        'created_at', s.created_at,
                        'modified_at', s.modified_at
                    ) AS data
                FROM sessions s
                WHERE s.user_id = :user_id
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
                AND t.revision > :from_revision

                UNION ALL

                SELECT
                    d.model_id AS id,
                    d.model_name::text AS model,
                    d.revision,
                    jsonb_build_object(
                        'deleted', true
                    ) AS data
                FROM deletions d
                WHERE d.user_id = :user_id
                AND d.revision > :from_revision
            """),
            {
                "user_id": auth_context.user.id,
                "session_id": auth_context.session.id,
                "from_revision": from_revision,
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


state = StateService()
