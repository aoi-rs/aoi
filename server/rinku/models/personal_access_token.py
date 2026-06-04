from uuid import UUID
from datetime import datetime

from sqlalchemy import UUID as SQLUUID, CHAR, ARRAY, Enum, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, declared_attr, relationship

from rinku.kit.db.models import RecordModel
from rinku.auth.permission import Permission
from rinku.models import User


class PersonalAccessToken(RecordModel):
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
    revoked_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, default=None, index=True
    )

    @declared_attr
    def user(cls) -> Mapped["User"]:
        return relationship(User, lazy="raise")
