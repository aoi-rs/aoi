from typing import Annotated
from fastapi import Depends

from aoi.auth.models import AuthContext
from aoi.auth.dependencies import Authenticator
from aoi.auth.permission import Permission

_SessionsRead = Authenticator(
    required_permissions={Permission.sessions_read, Permission.sessions_write}
)

SessionsRead = Annotated[AuthContext, Depends(_SessionsRead)]

_SessionsWrite = Authenticator(required_permissions={Permission.sessions_write})

SessionsWrite = Annotated[AuthContext, Depends(_SessionsWrite)]
