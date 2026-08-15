from aoi.kit.db.models import RecordModel, RevisionModel

from sqlalchemy import BIGINT, FetchedValue, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import CITEXT


class User(RecordModel, RevisionModel):
    __tablename__ = "users"

    state_revision: Mapped[int] = mapped_column(
        BIGINT,
        nullable=False,
        server_default="0",
        server_onupdate=FetchedValue(),
    )
    name: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False, unique=True)
