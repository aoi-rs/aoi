from fastapi import APIRouter, Depends, Response

from rinku.links.schemas import Link, LinkCreate
from rinku.links.service import links
from rinku.auth.models import RequestContext
from rinku.auth.middlewares import authenticate_request

router = APIRouter(prefix="/links")


@router.post("/", summary="Create a link", response_model=Link)
def create(
    request: LinkCreate, context: RequestContext = Depends(authenticate_request)
) -> Link:
    return links.create(context, destination_url=request.destination_url)


redirect_router = APIRouter(prefix="/_")


@redirect_router.get(
    "/{slug}",
    summary="Redirect to destination URL",
    status_code=301,
    responses={301: {"description": "Redirected."}},
)
def redirect(slug: str) -> Response:
    return links.redirect(slug)
