from pydantic import UUID7
from datetime import datetime

from aoi.kit.schemas import IDSchema, TimestampedSchema


class SessionSchema(IDSchema, TimestampedSchema):
    user_id: UUID7
    user_agent: str
    name: str
    refreshed_at: datetime
    revoked: bool
    is_current_session: bool
