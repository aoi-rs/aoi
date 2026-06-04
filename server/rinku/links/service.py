from collections.abc import Sequence
from fastapi.responses import Response, RedirectResponse

from rinku.links.schemas import LinkSchema, DestinationURL
from rinku.links.repository import link_repository
from rinku.auth.models import AuthContext
from rinku.links.counter import monotonic_counter
from rinku.links.utils import generate_slug, extract_uuid_timestamp
from rinku.exceptions import ResourceMissing
from rinku.kit.pagination import PaginationParams
from rinku.kit.utils import generate_uuid


class LinkMissing(ResourceMissing):
    def __init__(self, slug: str):
        super().__init__(f"The link '{slug}' could not be found")


class LinkService:
    def create(
        self, auth_context: AuthContext, destination_url: DestinationURL
    ) -> LinkSchema:
        number = monotonic_counter.increment()
        slug = generate_slug(number)
        id = generate_uuid()
        created_at = extract_uuid_timestamp(id)

        link = LinkSchema(
            id=id,
            user_id=auth_context.user.id,
            slug=slug,
            destination_url=str(destination_url),
            created_at=created_at,
        )

        link_repository.create(link)

        return link

    def redirect(self, slug: str) -> Response:
        destination_url = link_repository.get_destination_url_by_slug(slug)

        if destination_url is None:
            raise LinkMissing(slug)

        return RedirectResponse(destination_url, status_code=301)

    def list(
        self, context: AuthContext, pagination: PaginationParams
    ) -> Sequence[LinkSchema]:
        return link_repository.paginate(context, limit=pagination.limit)


links = LinkService()
