from pydantic import EmailStr
from rinku.kit.schemas import IDSchema, TimestampedSchema, Schema


class UserSchema(IDSchema, TimestampedSchema):
    email: EmailStr
    name: str | None


class UserUpdate(Schema):
    name: str | None = None
    avatar_url: str | None = None
