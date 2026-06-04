from fastapi import APIRouter

from .login_tokens.router import router as login_token_router
from .sessions.router import router as session_router
from .users.router import router as user_router
from .links.router import router as link_router
from .personal_access_tokens.router import router as personal_access_token_router

router = APIRouter(prefix="/v1")

# /login_tokens
router.include_router(login_token_router)

# /user & /users
router.include_router(user_router)

# /sessions
router.include_router(session_router)

# /links
router.include_router(link_router)

# /personal_access_tokens
router.include_router(personal_access_token_router)
