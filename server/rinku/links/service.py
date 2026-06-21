from collections.abc import Sequence
from uuid import UUID
from botocore.errorfactory import ClientError

from rinku.links.schemas import LinkSchema, LinkCreate, LinkUpdate
from rinku.links.repository import link_repository
from rinku.auth.models import AuthContext
from rinku.links.counter import monotonic_counter
from rinku.links.utils import generate_slug, extract_uuid_timestamp
from rinku.exceptions import ResourceMissing
from rinku.kit.pagination import PaginationParams
from rinku.kit.utils import generate_uuid


class LinkMissing(ResourceMissing):
    def __init__(self, id: UUID):
        super().__init__(f"The link '{id}' could not be found")


class LinkService:
    def create(
        self,
        auth_context: AuthContext,
        create_schema: LinkCreate,
    ) -> LinkSchema:
        number = monotonic_counter.increment()
        slug = generate_slug(number)
        id = generate_uuid()
        created_at = extract_uuid_timestamp(id)

        link = LinkSchema(
            id=id,
            user_id=auth_context.user.id,
            name=create_schema.name,
            slug=slug,
            destination_url=str(create_schema.destination_url),
            created_at=created_at,
        )

        link_repository.create(link)

        return link

    def update(
        self, auth_context: AuthContext, id: UUID, update_schema: LinkUpdate
    ) -> LinkSchema:
        update_dict = update_schema.model_dump(exclude_unset=True)

        if update_dict:
            try:
                return link_repository.update(auth_context, id, **update_dict)
            except ClientError as e:
                if self._is_conditional_check_failed_error(e):
                    raise LinkMissing(id) from e

                raise
        else:
            link = link_repository.get_one_or_none(auth_context, id)

            if not link:
                raise LinkMissing(id)

            return link

    def get(self, auth_context: AuthContext, id: UUID) -> LinkSchema | None:
        return link_repository.get_one_or_none(auth_context, id)

    def list(
        self, context: AuthContext, pagination: PaginationParams
    ) -> Sequence[LinkSchema]:
        return link_repository.paginate(context, limit=pagination.limit)

    def _is_conditional_check_failed_error(self, err: ClientError) -> bool:
        return (
            "Error" in err.response
            and "Code" in err.response["Error"]
            and err.response["Error"]["Code"] == "ConditionalCheckFailedException"
        )


links = LinkService()
