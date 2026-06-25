from uuid import UUID
from dataclasses import dataclass
from typing import TypeGuard

from aoi.models import PersonalAccessToken
from .permission import Permission


@dataclass
class UserRef:
    id: UUID


@dataclass
class SessionRef:
    id: UUID
    user_id: UUID


Session = SessionRef | PersonalAccessToken


class AuthContext:
    user: UserRef
    permissions: set[Permission]
    session: Session

    def __init__(self, user_id: UUID, permissions: set[Permission], session: Session):
        self.user = UserRef(user_id)
        self.permissions = permissions
        self.session = session


def is_user_session(session: Session) -> TypeGuard[SessionRef]:
    return isinstance(session, SessionRef)
