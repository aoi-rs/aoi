from typing import Annotated
from fastapi import Depends

from aoi.auth.dependencies import Authenticator
from aoi.auth.permission import Permission
from aoi.auth.models import AuthContext

UserRead = Annotated[
    AuthContext,
    Depends(
        Authenticator(
            required_permissions={Permission.user_read, Permission.user_write}
        )
    ),
]

UserWrite = Annotated[
    AuthContext, Depends(Authenticator(required_permissions={Permission.user_write}))
]
