from typing import Annotated
from fastapi import Depends

from aoi.auth.models import AuthContext
from aoi.auth.dependencies import Authenticator
from aoi.auth.permission import Permission

_PersonalAccessTokensRead = Authenticator(
    required_permissions={
        Permission.personal_access_tokens_read,
        Permission.personal_access_tokens_write,
    }
)

PersonalAccessTokensRead = Annotated[AuthContext, Depends(_PersonalAccessTokensRead)]

_PersonalAccessTokensWrite = Authenticator(
    required_permissions={Permission.personal_access_tokens_write}
)

PersonalAccessTokensWrite = Annotated[AuthContext, Depends(_PersonalAccessTokensWrite)]
