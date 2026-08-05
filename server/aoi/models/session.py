from datetime import datetime
from uuid import UUID
from alembic_utils.pg_trigger import PGTrigger
from alembic_utils.replaceable_entity import register_entities
from sqlalchemy import Text, TIMESTAMP, UUID as SQLUUID, ForeignKey, BIGINT
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr
from functools import cached_property
from ua_parser import parse

from aoi.kit.db.models import RecordModel, RevisionModel
from aoi.models import User
from aoi.kit.utils import utc_now


def session_name_from_user_agent(user_agent: str) -> str:
    ua = parse(user_agent)

    browser = ua.user_agent.family if ua.user_agent else "Unknown browser"
    os = ua.os.family if ua.os else "unknown OS"

    return f"{browser} on {os}"


class Session(RecordModel, RevisionModel):
    __tablename__ = "sessions"

    user_agent: Mapped[str] = mapped_column(Text, nullable=False)
    refreshed_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=utc_now
    )
    refresh_token_hmac_key: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token_counter: Mapped[int] = mapped_column(
        BIGINT, nullable=False, default=0
    )
    user_id: Mapped[UUID] = mapped_column(
        SQLUUID, ForeignKey("users.id", ondelete="cascade"), nullable=False
    )

    @declared_attr
    def user(cls) -> Mapped[User]:
        return relationship(User, lazy="joined")

    @cached_property
    def name(self) -> str:
        return session_name_from_user_agent(self.user_agent)


session_deletion_trigger = PGTrigger(
    schema="public",
    signature="session_deletion",
    on_entity="sessions",
    definition="""
    AFTER DELETE ON sessions
    REFERENCING OLD TABLE AS deleted_rows
    FOR EACH STATEMENT
    EXECUTE FUNCTION record_deletions('session')
    """,
)

register_entities((session_deletion_trigger,))
