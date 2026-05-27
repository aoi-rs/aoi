import time

from rinku.kit.db.models import RecordModel

from sqlalchemy import String, Integer, Uuid
from sqlalchemy.schema import Index, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr
from sqlalchemy.dialects.postgresql import CITEXT
from uuid import UUID
from enum import StrEnum


class OAuthPlatform(StrEnum):
    # Maximum length is 32 characters
    google = "google"


class OAuthAccount(RecordModel):
    __tablename__ = "oauth_accounts"

    __table_args__ = (
        UniqueConstraint("platform", "account_id"),
        Index("idx_user_id_platform", "user_id", "platform"),
    )

    platform: Mapped[OAuthPlatform] = mapped_column(String(32), nullable=False)
    access_token: Mapped[str] = mapped_column(String(1024), nullable=False)
    expires_at: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)
    refresh_token: Mapped[str | None] = mapped_column(
        String(1024), nullable=True, default=None
    )
    refresh_token_expires_at: Mapped[int | None] = mapped_column(
        Integer, nullable=True, default=None
    )
    account_id: Mapped[str] = mapped_column(String(320), nullable=False)
    account_email: Mapped[str] = mapped_column(String(320), nullable=False)
    account_username: Mapped[str | None] = mapped_column(
        String(320), nullable=True, default=None
    )

    user_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="cascade"), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="oauth_accounts")

    def is_access_token_expired(self) -> bool:
        if self.expires_at is None:
            return False

        return time.time() > self.expires_at

    def should_refresh_access_token(self, unless_ttl_gt: int = 60 * 30) -> bool:
        if (
            self.expires_at
            and self.refresh_token
            and self.expires_at <= (time.time() + unless_ttl_gt)
        ):
            return True

        return False


class User(RecordModel):
    __tablename__ = "users"

    name: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False, unique=True)

    @declared_attr
    def oauth_accounts(cls) -> Mapped[list[OAuthAccount]]:
        return relationship(OAuthAccount, lazy="joined", back_populates="user")

    def get_oauth_account(self, platform: OAuthPlatform) -> OAuthAccount | None:
        return next(
            (
                account
                for account in self.oauth_accounts
                if account.platform == platform
            ),
            None,
        )
