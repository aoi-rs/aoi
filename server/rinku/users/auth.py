from typing import Annotated
from fastapi import Depends

from rinku.auth.dependencies import Authenticator
from rinku.auth.permission import Permission
from rinku.auth.models import AuthContext

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
