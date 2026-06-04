from datetime import datetime, timedelta
from pydantic import UUID7

from rinku.kit.schemas import Schema, IDSchema, TimestampedSchema
from rinku.auth.permission import Permission


class PersonalAccessTokenCreate(Schema):
    name: str
    expires_in: timedelta | None = None
    permissions: list[Permission]


class PersonalAccessTokenSchema(IDSchema, TimestampedSchema):
    user_id: UUID7
    permissions: list[Permission]
    name: str
    expires_at: datetime | None


class PersonalAccessTokenCreateResponse(Schema):
    token: str
    personal_access_token: PersonalAccessTokenSchema


class PersonalAccessTokenUpdate(Schema):
    name: str | None = None
    permissions: list[Permission] | None = None
