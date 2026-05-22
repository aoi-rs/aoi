from pydantic import EmailStr
from rinku.kit.schemas import IDSchema, TimestampedSchema

class UserSchema(IDSchema, TimestampedSchema):
  email: EmailStr
  name: str | None
