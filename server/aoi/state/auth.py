from typing import Annotated
from fastapi import Depends

from aoi.auth.models import AuthContext
from aoi.auth.dependencies import Authenticator
from aoi.auth.permission import Permission

_StateRead = Authenticator(required_permissions={Permission.state_read})

StateRead = Annotated[AuthContext, Depends(_StateRead)]
