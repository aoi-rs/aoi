from datetime import datetime
from aoi.kit.db.models import RecordModel

from sqlalchemy import String, TIMESTAMP, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column


class LoginToken(RecordModel):
    __tablename__ = "login_tokens"
    __table_args__ = (UniqueConstraint("token_hash", "email"),)

    email: Mapped[str] = mapped_column(String, nullable=False)
    token_hash: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False
    )
