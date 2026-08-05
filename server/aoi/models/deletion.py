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


record_deletions_function = PGFunction(
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
)

register_entities((record_deletions_function,))
