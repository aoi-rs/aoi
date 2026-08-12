from datetime import datetime
from typing import Literal

from fastapi.responses import StreamingResponse
from pydantic import Field

from aoi.auth.permission import Permission
from aoi.kit.schemas import IDSchema, Schema, TimestampedSchema
from aoi.users.schemas import UserSchema


class UserDelta(UserSchema):
    model: Literal["user"] = Field("user", alias="_model")


class SessionDelta(IDSchema, TimestampedSchema):
    model: Literal["session"] = Field("session", alias="_model")
    user_agent: str
    name: str
    refreshed_at: datetime
    is_current_session: bool


class PersonalAccessTokenDelta(IDSchema, TimestampedSchema):
    model: Literal["personal_access_token"] = Field(
        "personal_access_token", alias="_model"
    )
    permissions: list[Permission]
    name: str
    expires_at: datetime | None


class MetadataFields(Schema):
    last_revision: int


class Metadata(Schema):
    metadata: MetadataFields = Field(..., alias="_metadata")


class DeletionDelta(IDSchema):
    model: Literal["session", "personal_access_token"] = Field(..., alias="_model")
    deleted: Literal[True] = True


Delta = UserDelta | SessionDelta | PersonalAccessTokenDelta | DeletionDelta | Metadata


class DeltaStream(StreamingResponse):
    media_type = "application/x-ndjson"
