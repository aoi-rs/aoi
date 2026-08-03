from datetime import datetime
from typing import Literal, Any

from fastapi.responses import StreamingResponse
from pydantic import model_validator

from aoi.auth.permission import Permission
from aoi.kit.schemas import IDSchema, Schema, TimestampedSchema
from aoi.users.schemas import UserSchema


class UserDelta(UserSchema):
    _model: Literal["user"] = "user"


class SessionDelta(IDSchema, TimestampedSchema):
    _model: Literal["session"] = "session"
    user_agent: str
    name: str
    refreshed_at: datetime


class PersonalAccessTokenDelta(IDSchema, TimestampedSchema):
    _model: Literal["personal_access_token"] = "personal_access_token"
    permissions: list[Permission]
    name: str
    expires_at: datetime | None


class MetadataFields(Schema):
    last_revision: int


class Metadata(Schema):
    _metadata: MetadataFields

    @model_validator(mode="before")
    @classmethod
    def initialize(cls, data: Any) -> Metadata:
        if "last_revision" in data:
            return Metadata(
                _metadata=MetadataFields(last_revision=data["last_revision"])
            )

        return data


class DeletionDelta(Schema):
    _model: Literal["session", "personal_access_token"]


Delta = UserDelta | SessionDelta | PersonalAccessTokenDelta | DeletionDelta | Metadata


class DeltaStream(StreamingResponse):
    media_type = "application/x-ndjson"
