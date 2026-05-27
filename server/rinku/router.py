from fastapi import APIRouter

from .login_tokens.router import router as login_token_router
from .sessions.router import router as session_router
from .users.router import router as user_router
from .integrations.google.router import router as google_router

router = APIRouter(prefix="/v1")

# /login_tokens
router.include_router(login_token_router)

# /integrations/google
router.include_router(google_router)

# /user & /users
router.include_router(user_router)

# /sessions
router.include_router(session_router)
