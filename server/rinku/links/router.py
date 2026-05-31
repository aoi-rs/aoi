from fastapi import APIRouter, Depends, Response

from rinku.links.schemas import LinkSchema, LinkCreate
from rinku.links.service import links
from rinku.auth.models import RequestContext
from rinku.auth.middlewares import authenticate_request
from rinku.kit.pagination import PaginationParamsQuery, ListResource

router = APIRouter(prefix="/links")


@router.post("/", summary="Create a link", response_model=LinkSchema)
def create(
    request: LinkCreate, context: RequestContext = Depends(authenticate_request)
) -> LinkSchema:
    return links.create(context, destination_url=request.destination_url)


@router.get("/", summary="List links")
def list(
    pagination: PaginationParamsQuery,
    context: RequestContext = Depends(authenticate_request),
) -> ListResource[LinkSchema]:
    items = links.list(context, pagination)

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
