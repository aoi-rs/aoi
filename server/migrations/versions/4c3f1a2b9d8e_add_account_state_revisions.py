"""add account state revisions

Revision ID: 4c3f1a2b9d8e
Revises: e83364fd2be3
Create Date: 2026-08-15 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
from alembic_utils.pg_function import PGFunction
from alembic_utils.pg_trigger import PGTrigger
import sqlalchemy as sa


revision: str = "4c3f1a2b9d8e"
down_revision: Union[str, Sequence[str], None] = "e83364fd2be3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def account_revision_entities() -> tuple[PGFunction | PGTrigger, ...]:
    return (
        PGFunction(
            schema="public",
            signature="allocate_account_revision(account_id uuid)",
            definition="""
            RETURNS BIGINT AS $$
            DECLARE
                revisions JSONB := COALESCE(
                    NULLIF(current_setting('aoi.state_revisions', TRUE), ''),
                    '{}'
                )::JSONB;
                cached_revision TEXT := revisions ->> account_id::TEXT;
                allocated_revision BIGINT;
            BEGIN
                IF cached_revision IS NOT NULL THEN
                    RETURN cached_revision::BIGINT;
                END IF;

                UPDATE users
                SET state_revision = state_revision + 1
                WHERE id = account_id
                RETURNING state_revision INTO allocated_revision;

                IF allocated_revision IS NULL THEN
                    RAISE EXCEPTION 'Cannot allocate state revision for missing user %', account_id
                        USING ERRCODE = 'foreign_key_violation';
                END IF;

                PERFORM set_config(
                    'aoi.state_revisions',
                    (revisions || jsonb_build_object(account_id::TEXT, allocated_revision))::TEXT,
                    TRUE
                );

                RETURN allocated_revision;
            END
            $$ LANGUAGE plpgsql VOLATILE;
            """,
        ),
        PGFunction(
            schema="public",
            signature="set_user_state_revision()",
            definition="""
            RETURNS TRIGGER AS $$
            DECLARE
                revisions JSONB := COALESCE(
                    NULLIF(current_setting('aoi.state_revisions', TRUE), ''),
                    '{}'
                )::JSONB;
                cached_revision TEXT := revisions ->> NEW.id::TEXT;
                allocated_revision BIGINT;
            BEGIN
                IF cached_revision IS NOT NULL THEN
                    allocated_revision := cached_revision::BIGINT;
                ELSIF TG_OP = 'INSERT' THEN
                    allocated_revision := COALESCE(NEW.state_revision, 0) + 1;
                    revisions := revisions || jsonb_build_object(
                        NEW.id::TEXT,
                        allocated_revision
                    );
                    PERFORM set_config('aoi.state_revisions', revisions::TEXT, TRUE);
                ELSE
                    allocated_revision := OLD.state_revision + 1;
                    revisions := revisions || jsonb_build_object(
                        NEW.id::TEXT,
                        allocated_revision
                    );
                    PERFORM set_config('aoi.state_revisions', revisions::TEXT, TRUE);
                END IF;

                NEW.state_revision := allocated_revision;
                NEW.revision := allocated_revision;

                RETURN NEW;
            END
            $$ LANGUAGE plpgsql VOLATILE;
            """,
        ),
        PGFunction(
            schema="public",
            signature="set_owned_model_revision()",
            definition="""
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.revision := allocate_account_revision(NEW.user_id);
                RETURN NEW;
            END
            $$ LANGUAGE plpgsql VOLATILE;
            """,
        ),
        PGFunction(
            schema="public",
            signature="record_deletion()",
            definition="""
            RETURNS TRIGGER AS $$
            DECLARE
                allocated_revision BIGINT;
            BEGIN
                allocated_revision := allocate_account_revision(OLD.user_id);

                INSERT INTO deletions (
                    user_id,
                    model_name,
                    model_id,
                    revision,
                    created_at
                ) VALUES (
                    OLD.user_id,
                    TG_ARGV[0]::deleted_model,
                    OLD.id,
                    allocated_revision,
                    transaction_timestamp()
                );

                RETURN OLD;
            END
            $$ LANGUAGE plpgsql VOLATILE;
            """,
        ),
        PGTrigger(
            schema="public",
            signature="user_insert_state_revision",
            on_entity="public.users",
            is_constraint=False,
            definition="""
            BEFORE INSERT ON users
            FOR EACH ROW
            EXECUTE FUNCTION set_user_state_revision()
            """,
        ),
        PGTrigger(
            schema="public",
            signature="user_update_state_revision",
            on_entity="public.users",
            is_constraint=False,
            definition="""
            BEFORE UPDATE OF email, name ON users
            FOR EACH ROW
            WHEN (
                OLD.email IS DISTINCT FROM NEW.email
                OR OLD.name IS DISTINCT FROM NEW.name
            )
            EXECUTE FUNCTION set_user_state_revision()
            """,
        ),
        PGTrigger(
            schema="public",
            signature="session_state_revision",
            on_entity="public.sessions",
            is_constraint=False,
            definition="""
            BEFORE INSERT OR UPDATE ON sessions
            FOR EACH ROW
            EXECUTE FUNCTION set_owned_model_revision()
            """,
        ),
        PGTrigger(
            schema="public",
            signature="personal_access_token_state_revision",
            on_entity="public.personal_access_tokens",
            is_constraint=False,
            definition="""
            BEFORE INSERT OR UPDATE ON personal_access_tokens
            FOR EACH ROW
            EXECUTE FUNCTION set_owned_model_revision()
            """,
        ),
        PGTrigger(
            schema="public",
            signature="session_deletion",
            on_entity="public.sessions",
            is_constraint=False,
            definition="""
            BEFORE DELETE ON sessions
            FOR EACH ROW
            EXECUTE FUNCTION record_deletion('session')
            """,
        ),
        PGTrigger(
            schema="public",
            signature="personal_access_token_deletions",
            on_entity="public.personal_access_tokens",
            is_constraint=False,
            definition="""
            BEFORE DELETE ON personal_access_tokens
            FOR EACH ROW
            EXECUTE FUNCTION record_deletion('personal_access_token')
            """,
        ),
    )


def legacy_deletion_entities() -> tuple[PGFunction | PGTrigger, ...]:
    return (
        PGFunction(
            schema="public",
            signature="record_deletions()",
            definition="""
            RETURNS TRIGGER AS $$
            BEGIN
                INSERT INTO deletions (model_name, model_id)
                SELECT TG_ARGV[0]::deleted_model, id
                FROM deleted_rows;

                RETURN NULL;
            END
            $$ LANGUAGE plpgsql;
            """,
        ),
        PGTrigger(
            schema="public",
            signature="session_deletion",
            on_entity="public.sessions",
            is_constraint=False,
            definition="""
            AFTER DELETE ON sessions
            REFERENCING OLD TABLE AS deleted_rows
            FOR EACH STATEMENT
            EXECUTE FUNCTION record_deletions('session')
            """,
        ),
        PGTrigger(
            schema="public",
            signature="personal_access_token_deletions",
            on_entity="public.personal_access_tokens",
            is_constraint=False,
            definition="""
            AFTER DELETE ON personal_access_tokens
            REFERENCING OLD TABLE AS deleted_rows
            FOR EACH STATEMENT
            EXECUTE FUNCTION record_deletions('personal_access_token')
            """,
        ),
    )


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM deletions) THEN
                RAISE EXCEPTION
                    'Cannot safely assign existing deletion tombstones to users'
                    USING HINT =
                        'Existing tombstones predate account ownership. '
                        'Resolve them before applying this migration.';
            END IF;
        END
        $$
    """)

    for entity in reversed(legacy_deletion_entities()[1:]):
        op.drop_entity(entity)  # pyright: ignore[reportAttributeAccessIssue]
    op.drop_entity(  # pyright: ignore[reportAttributeAccessIssue]
        legacy_deletion_entities()[0]
    )

    op.add_column(
        "users",
        sa.Column("state_revision", sa.BIGINT(), server_default="0", nullable=False),
    )

    # Start existing accounts above every previously issued global revision so
    # clients holding an old global cursor cannot skip their next account update.
    op.execute("""
        UPDATE users
        SET state_revision = (SELECT last_value FROM revision_number)
    """)

    op.add_column("deletions", sa.Column("user_id", sa.UUID(), nullable=False))
    op.add_column(
        "deletions",
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_deletions_user_id_revision",
        "deletions",
        ["user_id", "revision"],
        unique=False,
    )

    for table_name in ("users", "sessions", "personal_access_tokens", "deletions"):
        op.alter_column(table_name, "revision", server_default=sa.text("0"))

    op.execute("DROP SEQUENCE revision_number")

    for entity in account_revision_entities():
        op.create_entity(entity)  # pyright: ignore[reportAttributeAccessIssue]


def downgrade() -> None:
    for entity in reversed(account_revision_entities()):
        op.drop_entity(entity)  # pyright: ignore[reportAttributeAccessIssue]

    op.execute("""
        CREATE SEQUENCE revision_number
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 100
    """)
    op.execute("""
        SELECT setval(
            'revision_number',
            GREATEST(
                COALESCE((SELECT MAX(revision) FROM users), 0),
                COALESCE((SELECT MAX(revision) FROM sessions), 0),
                COALESCE((SELECT MAX(revision) FROM personal_access_tokens), 0),
                COALESCE((SELECT MAX(revision) FROM deletions), 0),
                1
            ),
            TRUE
        )
    """)

    for table_name in ("users", "sessions", "personal_access_tokens", "deletions"):
        op.alter_column(
            table_name,
            "revision",
            server_default=sa.text("nextval('revision_number')"),
        )

    op.drop_index("ix_deletions_user_id_revision", table_name="deletions")
    op.drop_column("deletions", "created_at")
    op.drop_column("deletions", "user_id")
    op.drop_column("users", "state_revision")

    for entity in legacy_deletion_entities():
        op.create_entity(entity)  # pyright: ignore[reportAttributeAccessIssue]
