from datetime import datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import TIMESTAMP, UUID as SQLUUID, Enum, Index, func
from sqlalchemy.orm import mapped_column, Mapped

from aoi.kit.db.models import RevisionModel


class DeletedModel(StrEnum):
    session = "session"
    personal_access_token = "personal_access_token"


class Deletion(RevisionModel):
    __tablename__ = "deletions"
    __table_args__ = (Index("ix_deletions_user_id_revision", "user_id", "revision"),)

    model_id: Mapped[UUID] = mapped_column(SQLUUID, primary_key=True)
    model_name: Mapped[DeletedModel] = mapped_column(
        Enum(DeletedModel, name="deleted_model"), primary_key=True
    )
    user_id: Mapped[UUID] = mapped_column(SQLUUID, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
