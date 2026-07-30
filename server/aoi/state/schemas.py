from typing import Literal

from pydantic import Field

from aoi.kit.schemas import Schema
from aoi.users.schemas import UserSchema


class DownloadedUser(UserSchema):
    model_: Literal["user"] = Field(default="user", serialization_alias="__model")


class Metadata(Schema):
    last_revision: int


DownloadedState = DownloadedUser | Metadata
