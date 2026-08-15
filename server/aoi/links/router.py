from collections.abc import Sequence
from fastapi import APIRouter
from pydantic import UUID7

from aoi.links.schemas import LinkSchema, LinkCreate, LinkUpdate
from aoi.links.service import links
from aoi.links.auth import LinksRead, LinksWrite
from aoi.kit.pagination import PaginationParamsQuery
from aoi.exceptions import ResourceMissing

router = APIRouter(prefix="/links")


@router.get("/", summary="List links", response_model=Sequence[LinkSchema])
def list(
    pagination: PaginationParamsQuery,
    auth_context: LinksRead,
) -> Sequence[LinkSchema]:
    items = links.list(auth_context, pagination)
    return items


@router.get("/{id}", summary="Get a link", response_model=LinkSchema)
def get(id: UUID7, auth_context: LinksRead) -> LinkSchema:
    link = links.get(auth_context, id)

    if not link:
        raise ResourceMissing(message=f"The link '{id}' could not be found")

    return link


@router.post("/", summary="Create a link", response_model=LinkSchema)
def create(link_create: LinkCreate, auth_context: LinksWrite) -> LinkSchema:
    return links.create(auth_context, create_schema=link_create)


@router.patch("/{id}", summary="Update a link", response_model=LinkSchema)
async def update(
    id: UUID7,
    link_update: LinkUpdate,
    auth_context: LinksWrite,
) -> LinkSchema:
    return links.update(auth_context, id, update_schema=link_update)
