from uuid import UUID
from typing import Any, TypedDict

from boto3.dynamodb.conditions import Key

from aoi.links.schemas import LinkSchema
from aoi.links.utils import extract_uuid_timestamp
from aoi.integrations.aws.dynamodb.client import dynamodb
from aoi.auth.models import AuthContext

table = dynamodb.Table("links")


class UpdateDict(TypedDict):
    name: str | None


class LinkRepository:
    def create(self, schema: LinkSchema):
        table.put_item(Item=self._encode(schema))

    def update(
        self, auth_context: AuthContext, id: UUID, *, name: str | None
    ) -> LinkSchema:
        response = table.update_item(
            Key={"u": auth_context.user.id.bytes, "i": id.bytes},
            UpdateExpression="SET #n = :name",
            ConditionExpression="attribute_exists(i)",
            ExpressionAttributeNames={"#n": "n"},
            ExpressionAttributeValues={":name": name},
            ReturnValues="ALL_NEW",
        )

        return self._decode(response["Attributes"])

    def get_one_or_none(self, auth_context: AuthContext, id: UUID) -> LinkSchema | None:
        response = table.get_item(Key={"u": auth_context.user.id.bytes, "i": id.bytes})

        if "Item" not in response:
            return None

        return self._decode(response["Item"])

    def paginate(self, auth_context: AuthContext, *, limit: int) -> list[LinkSchema]:
        response = table.query(
            KeyConditionExpression=Key("u").eq(auth_context.user.id.bytes),
            ScanIndexForward=False,
            Limit=limit,
        )

        return [self._decode(item) for item in response["Items"]]

    def _encode(self, schema: LinkSchema) -> dict[str, Any]:
        item: dict[str, Any] = {
            "i": schema.id.bytes,
            "u": schema.user_id.bytes,
            "s": schema.slug,
            "d": schema.destination_url,
        }

        if schema.name:
            item["n"] = schema.name

        return item

    def _decode(self, item: dict[str, Any]) -> LinkSchema:
        id = UUID(bytes=bytes(item["i"]))
        user_id = UUID(bytes=bytes(item["u"]))
        created_at = extract_uuid_timestamp(id)

        return LinkSchema(
            id=id,
            user_id=user_id,
            name=item.get("n"),
            slug=item["s"],
            destination_url=item["d"],
            created_at=created_at,
        )


link_repository = LinkRepository()
