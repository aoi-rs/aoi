from rinku.kit.schemas import Schema
from pydantic import EmailStr, UUID7


class LoginTokenRequest(Schema):
    email: EmailStr


class LoginTokenCheck(Schema):
    login_token_id: UUID7
    email: EmailStr
    token: str
