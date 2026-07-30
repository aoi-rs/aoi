from typing import Literal
from aoi.users.schemas import UserSchema


class DownloadedUser(UserSchema):
    _model: Literal["user"]
