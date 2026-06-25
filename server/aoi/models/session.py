from datetime import datetime
from uuid import UUID
from sqlalchemy import Text, Boolean, TIMESTAMP, Uuid, ForeignKey, BIGINT
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr
from functools import cached_property
from ua_parser import parse

from aoi.kit.db.models import RecordModel
from aoi.models import User
from aoi.kit.utils import utc_now


class Session(RecordModel):
    __tablename__ = "sessions"

    user_agent: Mapped[str] = mapped_column(Text, nullable=False)
    refreshed_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=utc_now
    )
    refresh_token_hmac_key: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token_counter: Mapped[int] = mapped_column(
        BIGINT(), nullable=False, default=0
    )
    revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    user_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="cascade"), nullable=False
    )

    @declared_attr
    def user(cls) -> Mapped[User]:
        return relationship(User, lazy="joined")

    @cached_property
    def name(self) -> str:
        ua = parse(self.user_agent)

        browser = ua.user_agent.family if ua.user_agent else "Unknown browser"
        os = ua.os.family if ua.os else "unknown OS"

        return f"{browser} on {os}"
