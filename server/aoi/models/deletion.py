from alembic_utils.pg_function import PGFunction
from alembic_utils.replaceable_entity import register_entities
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import UUID as SQLUUID, Enum

from uuid import UUID
from enum import StrEnum

from aoi.kit.db.models import RevisionModel


class DeletedModel(StrEnum):
    session = "session"
    personal_access_token = "personal_access_token"


class Deletion(RevisionModel):
    __tablename__ = "deletions"

    model_id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True)
    model_name: Mapped[DeletedModel] = mapped_column(
        Enum(DeletedModel, name="deleted_model"), primary_key=True
    )
    user_id: Mapped[UUID] = mapped_column(SQLUUID, nullable=False)


record_deletions_function = PGFunction(
    schema="public",
    signature="record_deletions()",
    definition="""
    RETURNS TRIGGER AS $$
    DECLARE
        allocated_revision BIGINT;
    BEGIN
        SELECT allocate_revision(user_id)
        INTO allocated_revision
        FROM deleted_rows
        LIMIT 1;

        INSERT INTO deletions (model_name, model_id, user_id, revision)
        SELECT TG_ARGV[0]::deleted_model, id, user_id, allocated_revision
        FROM deleted_rows;

        RETURN NULL;
    END
    $$ LANGUAGE plpgsql VOLATILE;
    """,
)

register_entities((record_deletions_function,))
