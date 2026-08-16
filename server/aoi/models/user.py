from alembic_utils.pg_trigger import PGTrigger
from alembic_utils.replaceable_entity import register_entities

from aoi.kit.db.models import RecordModel

from sqlalchemy import String, BIGINT, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import CITEXT
from alembic_utils.pg_function import PGFunction


class User(RecordModel):
    __tablename__ = "users"

    name: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False, unique=True)
    revision: Mapped[int] = mapped_column(
        BIGINT, nullable=False, server_default=text("1")
    )
    last_revision: Mapped[int] = mapped_column(
        BIGINT, nullable=False, server_default=text("initialize_user_revision()")
    )


allocate_revision_function = PGFunction(
    schema="public",
    signature="allocate_revision(user_id uuid)",
    definition="""
    RETURNS BIGINT AS $$
    DECLARE
        cached_revision TEXT := NULLIF(CURRENT_SETTING('aoi.revision', TRUE), '');
        allocated_revision BIGINT;
    BEGIN
        IF cached_revision IS NOT NULL THEN
            RETURN cached_revision::BIGINT;
        END IF; 

        UPDATE users
        SET last_revision = last_revision + 1
        WHERE id = user_id
        RETURNING last_revision INTO allocated_revision;

        IF allocated_revision IS NULL THEN
            RAISE EXCEPTION 'Cannot allocate revision for user % because it does not exist', user_id;
        END IF;

        PERFORM SET_CONFIG('aoi.revision', allocated_revision::TEXT ,TRUE);

        RETURN allocated_revision;
    END
    $$ LANGUAGE plpgsql VOLATILE;
    """,
)

initialize_user_revision_function = PGFunction(
    schema="public",
    signature="initialize_user_revision()",
    definition="""
    RETURNS BIGINT AS $$
    BEGIN
      PERFORM SET_CONFIG('aoi.revision', '1', TRUE);
      RETURN 1;
    END
    $$ LANGUAGE plpgsql VOLATILE;
    """,
)

advance_user_revision_function = PGFunction(
    schema="public",
    signature="advance_user_revision()",
    definition="""
    RETURNS TRIGGER AS $$
    DECLARE 
        cached_revision TEXT := NULLIF(CURRENT_SETTING('aoi.revision', TRUE), '');
        allocated_revision BIGINT;
    BEGIN
        IF cached_revision IS NOT NULL THEN
            allocated_revision := cached_revision::BIGINT;
        ELSE
            allocated_revision := OLD.last_revision + 1;
            PERFORM SET_CONFIG('aoi.revision', allocated_revision::TEXT, TRUE);
        END IF;

        NEW.last_revision := allocated_revision;
        NEW.revision := allocated_revision;

        RETURN NEW;
    END
    $$ LANGUAGE plpgsql VOLATILE;
    """,
)

advance_owned_model_revision_function = PGFunction(
    schema="public",
    signature="advance_owned_model_revision()",
    definition="""
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.revision := allocate_revision(NEW.user_id);
        RETURN NEW;
    END
    $$ LANGUAGE plpgsql VOLATILE;
    """,
)

advance_user_revision_trigger = PGTrigger(
    schema="public",
    signature="advance_user_revision",
    on_entity="users",
    definition="""
    BEFORE UPDATE OF email, name ON users
    FOR EACH ROW
    WHEN (
        OLD.email IS DISTINCT FROM NEW.email
        OR OLD.name IS DISTINCT FROM NEW.name
    )
    EXECUTE FUNCTION advance_user_revision()
    """,
)

register_entities(
    (
        allocate_revision_function,
        initialize_user_revision_function,
        advance_user_revision_function,
        advance_owned_model_revision_function,
        advance_user_revision_trigger,
    )
)
