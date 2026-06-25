from aoi.kit.schemas import Schema
from pydantic import EmailStr


class LoginTokenRequest(Schema):
    email: EmailStr
