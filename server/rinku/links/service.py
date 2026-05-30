from fastapi.responses import Response, RedirectResponse

from rinku.links.schemas import Link, DestinationURL
from rinku.auth.models import RequestContext
from rinku.links.counter import monotonic_counter
from rinku.links.utils import generate_slug
from rinku.integrations.aws.dynamodb.client import dynamodb
from rinku.exceptions import ResourceMissing

link_table = dynamodb.Table("links")


class LinkMissing(ResourceMissing):
    def __init__(self, slug: str):
        super().__init__(f"The link '{slug}' could not be found")


class LinkService:
    def create(self, context: RequestContext, destination_url: DestinationURL) -> Link:
        number = monotonic_counter.increment()
        slug = generate_slug(number)

        link = Link(
            user_id=context.user.id, slug=slug, destination_url=str(destination_url)
        )

        link_table.put_item(Item={"s": link.slug, "d": link.destination_url})

        return link

    def redirect(self, slug: str) -> Response:
        response = link_table.get_item(Key={"s": slug}, AttributesToGet=["d"])

        print(response)

        if "Item" not in response:
            raise LinkMissing(slug)

        destination_url = str(response["Item"]["d"])
        redirect_response = RedirectResponse(destination_url, status_code=301)

        return redirect_response


links = LinkService()
