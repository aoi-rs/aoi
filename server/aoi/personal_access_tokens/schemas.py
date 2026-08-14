from datetime import datetime, timedelta
from typing import Annotated, Self

from pydantic import Field, UUID7, model_validator

from aoi.kit.schemas import Schema, IDSchema, TimestampedSchema
from aoi.auth.permission import Permission


Permissions = Annotated[list[Permission], Field(min_length=1)]
PositiveTimedelta = Annotated[timedelta, Field(gt=timedelta(0))]


class PersonalAccessTokenCreate(Schema):
    name: str
    expires_in: PositiveTimedelta | None = None
    permissions: Permissions


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
    permissions: Permissions | None = None

    @model_validator(mode="after")
    def check_fields_are_not_explicit_null(self) -> Self:
        for field in ("name", "permissions"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"'{field}' cannot be null")

        return self
