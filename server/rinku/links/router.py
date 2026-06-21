from fastapi import APIRouter
from pydantic import UUID7

from rinku.links.schemas import LinkSchema, LinkCreate, LinkUpdate
from rinku.links.service import links
from rinku.links.auth import LinksRead, LinksWrite
from rinku.kit.pagination import PaginationParamsQuery, ListResource
from rinku.exceptions import ResourceMissing

router = APIRouter(prefix="/links")


@router.get("/", summary="List links", response_model=ListResource[LinkSchema])
def list(
    pagination: PaginationParamsQuery,
    auth_context: LinksRead,
) -> ListResource[LinkSchema]:
    items = links.list(auth_context, pagination)

    # TODO: return raw list instead of ListResource
    return ListResource[LinkSchema].from_paginated_results(items, 0)


@router.get("/{id}", summary="Get a link", response_model=LinkSchema)
def get(id: UUID7, auth_context: LinksWrite) -> LinkSchema:
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
