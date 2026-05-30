from rinku.kit.schemas import Schema
from typing import Annotated
from pydantic import UUID7, AnyUrl, UrlConstraints

DestinationURL = Annotated[
    AnyUrl,
    UrlConstraints(
        allowed_schemes=["http", "https"], max_length=2048, host_required=True
    ),
]


class Link(Schema):
    user_id: UUID7
    slug: str
    destination_url: str


class LinkCreate(Schema):
    destination_url: DestinationURL
