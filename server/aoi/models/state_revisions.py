from alembic_utils.pg_function import PGFunction
from alembic_utils.pg_trigger import PGTrigger
from alembic_utils.replaceable_entity import register_entities


allocate_account_revision_function = PGFunction(
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
)

set_user_state_revision_function = PGFunction(
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
)

set_owned_model_revision_function = PGFunction(
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
)

record_deletion_function = PGFunction(
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
)

user_insert_state_revision_trigger = PGTrigger(
    schema="public",
    signature="user_insert_state_revision",
    on_entity="users",
    definition="""
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_user_state_revision()
    """,
)

user_update_state_revision_trigger = PGTrigger(
    schema="public",
    signature="user_update_state_revision",
    on_entity="users",
    definition="""
    BEFORE UPDATE OF email, name ON users
    FOR EACH ROW
    WHEN (
        OLD.email IS DISTINCT FROM NEW.email
        OR OLD.name IS DISTINCT FROM NEW.name
    )
    EXECUTE FUNCTION set_user_state_revision()
    """,
)

session_state_revision_trigger = PGTrigger(
    schema="public",
    signature="session_state_revision",
    on_entity="sessions",
    definition="""
    BEFORE INSERT OR UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_owned_model_revision()
    """,
)

personal_access_token_state_revision_trigger = PGTrigger(
    schema="public",
    signature="personal_access_token_state_revision",
    on_entity="personal_access_tokens",
    definition="""
    BEFORE INSERT OR UPDATE ON personal_access_tokens
    FOR EACH ROW
    EXECUTE FUNCTION set_owned_model_revision()
    """,
)

session_deletion_trigger = PGTrigger(
    schema="public",
    signature="session_deletion",
    on_entity="sessions",
    definition="""
    BEFORE DELETE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION record_deletion('session')
    """,
)

personal_access_token_deletion_trigger = PGTrigger(
    schema="public",
    signature="personal_access_token_deletions",
    on_entity="personal_access_tokens",
    definition="""
    BEFORE DELETE ON personal_access_tokens
    FOR EACH ROW
    EXECUTE FUNCTION record_deletion('personal_access_token')
    """,
)

register_entities(
    (
        allocate_account_revision_function,
        set_user_state_revision_function,
        set_owned_model_revision_function,
        record_deletion_function,
        user_insert_state_revision_trigger,
        user_update_state_revision_trigger,
        session_state_revision_trigger,
        personal_access_token_state_revision_trigger,
        session_deletion_trigger,
        personal_access_token_deletion_trigger,
    )
)
