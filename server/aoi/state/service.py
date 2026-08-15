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

STATE_QUERY = text("""
    WITH deltas AS (
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
        AND (
            CAST(:full_download AS BOOLEAN)
            OR u.revision > :from_revision
        )

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
        AND (
            CAST(:full_download AS BOOLEAN)
            OR s.revision > :from_revision
        )

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
        AND (
            CAST(:full_download AS BOOLEAN)
            OR t.revision > :from_revision
        )

        UNION ALL

        SELECT
            d.model_id AS id,
            d.revision,
            d.model_name::TEXT AS model,
            jsonb_build_object('deleted', TRUE) AS data
        FROM deletions d
        WHERE NOT CAST(:full_download AS BOOLEAN)
        AND d.user_id = :user_id
        AND d.revision > :from_revision
    ), stream AS (
        SELECT
            id,
            revision,
            model,
            data,
            FALSE AS is_metadata
        FROM deltas

        UNION ALL

        SELECT
            NULL::UUID AS id,
            u.state_revision AS revision,
            NULL::TEXT AS model,
            NULL::JSONB AS data,
            TRUE AS is_metadata
        FROM users u
        WHERE u.id = :user_id
    )
    SELECT id, revision, model, data, is_metadata
    FROM stream
    ORDER BY is_metadata, revision, model, id
""")


class StateService:
    async def download(
        self, session: AsyncSession, auth_context: AuthContext
    ) -> AsyncGenerator[Delta]:
        async for delta in self._stream(
            session,
            auth_context,
            full_download=True,
            from_revision=0,
        ):
            yield delta

    async def refresh(
        self, session: AsyncSession, auth_context: AuthContext, from_revision: int
    ) -> AsyncGenerator[Delta]:
        async for delta in self._stream(
            session,
            auth_context,
            full_download=False,
            from_revision=from_revision,
        ):
            yield delta

    async def _stream(
        self,
        session: AsyncSession,
        auth_context: AuthContext,
        *,
        full_download: bool,
        from_revision: int,
    ) -> AsyncGenerator[Delta]:
        result = await session.stream(
            STATE_QUERY,
            {
                "user_id": auth_context.user.id,
                "session_id": auth_context.session.id,
                "full_download": full_download,
                "from_revision": from_revision,
            },
        )

        async for row in result:
            if row.is_metadata:
                metadata_fields = MetadataFields(last_revision=row.revision)
                yield Metadata(_metadata=metadata_fields)
            else:
                yield self._row_to_delta(row)

    def _row_to_delta(self, row: Row[Any]) -> Delta:
        if "deleted" in row.data:
            return DeletionDelta(_model=row.model, id=row.id)

        schema = MODEL_SCHEMAS[row.model]
        fields = {"id": row.id} | row.data

        if row.model == "session":
            fields |= {"name": session_name_from_user_agent(row.data["user_agent"])}

        return schema.model_validate(fields)


state = StateService()
