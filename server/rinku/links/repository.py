from uuid import UUID
from typing import Any
from boto3.dynamodb.conditions import Key

from rinku.links.schemas import LinkSchema
from rinku.links.utils import extract_uuid_timestamp
from rinku.integrations.aws.dynamodb.client import dynamodb
from rinku.auth.models import RequestContext

table = dynamodb.Table("links")


class LinkRepository:
    def create(self, schema: LinkSchema):
        table.put_item(Item=self._encode(schema))

    def paginate(self, context: RequestContext, *, limit: int) -> list[LinkSchema]:
        response = table.query(
            IndexName="user_links",
            KeyConditionExpression=Key("u").eq(context.user.id.bytes),
            ScanIndexForward=False,
            Limit=limit,
        )

        return [self._decode(item) for item in response["Items"]]

    def get_destination_url_by_slug(self, slug: str) -> str | None:
        response = table.get_item(Key={"s": slug}, AttributesToGet=["d"])

        if "Item" not in response:
            return None

        return str(response["Item"]["d"])

    def _encode(self, schema: LinkSchema) -> dict[str, Any]:
        return {
            "i": schema.id.bytes,
            "u": schema.user_id.bytes,
            "s": schema.slug,
            "d": schema.destination_url,
        }

    def _decode(self, item: dict[str, Any]) -> LinkSchema:
        id = UUID(bytes=bytes(item["i"]))
        user_id = UUID(bytes=bytes(item["u"]))
        created_at = extract_uuid_timestamp(id)

        return LinkSchema(
            id=id,
            user_id=user_id,
            slug=item["s"],
            destination_url=item["d"],
            created_at=created_at,
        )


link_repository = LinkRepository()
