from aoi.kit.schemas import Schema, IDSchema
from typing import Annotated
from datetime import datetime
from pydantic import UUID7, AnyUrl, UrlConstraints

DestinationURL = Annotated[
    AnyUrl,
    UrlConstraints(
        allowed_schemes=["http", "https"], max_length=2048, host_required=True
    ),
]


class LinkSchema(IDSchema):
    user_id: UUID7
    name: str | None
    slug: str
    destination_url: str
    created_at: datetime


class LinkCreate(Schema):
    name: str | None = None
    destination_url: DestinationURL


class LinkUpdate(Schema):
    name: str | None = None
