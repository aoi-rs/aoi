from datetime import datetime
from rinku.kit.db.models import RecordModel

from sqlalchemy import String, TIMESTAMP, Boolean
from sqlalchemy.orm import Mapped, mapped_column


class LoginToken(RecordModel):
    __tablename__ = "login_tokens"

    email: Mapped[str] = mapped_column(String, nullable=False)
    token_hash: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False
    )
    was_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
