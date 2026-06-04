from fastapi import APIRouter, Response

from rinku.links.schemas import LinkSchema, LinkCreate
from rinku.links.service import links
from rinku.links.auth import LinksRead, LinksWrite
from rinku.kit.pagination import PaginationParamsQuery, ListResource

router = APIRouter(prefix="/links")


@router.post("/", summary="Create a link", response_model=LinkSchema)
def create(request: LinkCreate, auth_context: LinksWrite) -> LinkSchema:
    return links.create(auth_context, destination_url=request.destination_url)


@router.get("/", summary="List links")
def list(
    pagination: PaginationParamsQuery,
    auth_context: LinksRead,
) -> ListResource[LinkSchema]:
    items = links.list(auth_context, pagination)

    # TODO: remove count from ListResource
    return ListResource[LinkSchema].from_paginated_results(items, 0)


redirect_router = APIRouter(prefix="/redirect")


@redirect_router.get(
    "/{slug}",
    summary="Redirect to destination URL",
    status_code=301,
    responses={301: {"description": "Redirected."}},
)
def redirect(slug: str) -> Response:
    return links.redirect(slug)
