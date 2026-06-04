from typing import Annotated
from fastapi import Depends

from rinku.auth.models import AuthContext
from rinku.auth.dependencies import Authenticator
from rinku.auth.permission import Permission

_LinksRead = Authenticator(
    required_permissions={Permission.links_read, Permission.links_write}
)

LinksRead = Annotated[AuthContext, Depends(_LinksRead)]

_LinksWrite = Authenticator(required_permissions={Permission.links_write})

LinksWrite = Annotated[AuthContext, Depends(_LinksWrite)]
