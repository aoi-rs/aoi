from uuid import UUID
from datetime import datetime

from alembic_utils.pg_trigger import PGTrigger
from alembic_utils.replaceable_entity import register_entities
from sqlalchemy import UUID as SQLUUID, CHAR, ARRAY, Enum, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, declared_attr, relationship

from aoi.kit.db.models import RecordModel, RevisionModel
from aoi.auth.permission import Permission
from aoi.models import User


class PersonalAccessToken(RecordModel, RevisionModel):
    __tablename__ = "personal_access_tokens"

    token_hash: Mapped[str] = mapped_column(CHAR(64), unique=True, nullable=False)
    permissions: Mapped[list[Permission]] = mapped_column(
        ARRAY(Enum(Permission)), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        SQLUUID, ForeignKey("users.id", ondelete="cascade"), nullable=False, index=True
    )

    @declared_attr
    def user(cls) -> Mapped["User"]:
        return relationship(User, lazy="raise")


personal_access_token_deletion_trigger = PGTrigger(
    schema="public",
    signature="personal_access_token_deletions",
    on_entity="personal_access_tokens",
    definition="""
    AFTER DELETE ON personal_access_tokens
    REFERENCING OLD TABLE AS deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION record_deletions('personal_access_token')
    """,
)

register_entities((personal_access_token_deletion_trigger,))
