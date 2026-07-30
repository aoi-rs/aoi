from aoi.kit.db.models import RecordModel

from sqlalchemy import String, Sequence, BIGINT
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import CITEXT

revision_number = Sequence("revision_number", start=1, increment=1)


class User(RecordModel):
    __tablename__ = "users"

    name: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False, unique=True)
    revision: Mapped[int] = mapped_column(
        BIGINT,
        nullable=False,
        onupdate=revision_number.next_value(),
        server_default=revision_number.next_value(),
    )
