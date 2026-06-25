from aoi.kit.db.models import RecordModel

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import CITEXT


class User(RecordModel):
    __tablename__ = "users"

    name: Mapped[str | None] = mapped_column(String, nullable=True, default=None)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False, unique=True)
