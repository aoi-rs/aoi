from uuid import UUID
from typing import Any, cast, TYPE_CHECKING

from aoi.kit.pagination import PaginationParams
from aoi.links.schemas import LinkSchema
from aoi.links.utils import extract_uuid_timestamp
from aoi.integrations.aws.dynamodb.client import dynamodb
from aoi.auth.models import AuthContext

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.type_defs import UniversalAttributeValueTypeDef


LINKS_TABLE_NAME = "links"

class LinkRepository:
    def create(self, schema: LinkSchema):
        dynamodb.put_item(
            TableName=LINKS_TABLE_NAME,
            Item=self._encode(schema),
            ConditionExpression="attribute_not_exists(#u)",
            ExpressionAttributeNames={"#u": "u"},
        )

    def update(
        self, auth_context: AuthContext, id: UUID, *, name: str | None
    ) -> LinkSchema:
        response = dynamodb.update_item(
            TableName=LINKS_TABLE_NAME,
            Key={"u": {"B": auth_context.user.id.bytes}, "i": {"B": id.bytes}},
            UpdateExpression="SET #n = :name",
            ConditionExpression="attribute_exists(i)",
            ExpressionAttributeNames={"#n": "n"},
            ExpressionAttributeValues={
                ":name": {"S": name} if name is not None else {"NULL": True}
            },
            ReturnValues="ALL_NEW",
        )

        return self._decode(response["Attributes"])

    def get_one_or_none(self, auth_context: AuthContext, id: UUID) -> LinkSchema | None:
        response = dynamodb.get_item(
            TableName=LINKS_TABLE_NAME,
            Key={"u": {"B": auth_context.user.id.bytes}, "i": {"B": id.bytes}},
        )

        if "Item" not in response:
            return None

        return self._decode(response["Item"])

    def paginate(
        self, auth_context: AuthContext, pagination: PaginationParams
    ) -> list[LinkSchema]:
        key_condition = "u = :user_id"

        expression_values: dict[str, UniversalAttributeValueTypeDef] = {
            ":user_id": {"B": auth_context.user.id.bytes},
        }

        if pagination.after:
            key_condition += " AND i < :after"
            expression_values[":after"] = {"B": pagination.after.bytes}

        if pagination.before:
            key_condition += " AND i > :before"
            expression_values[":before"] = {"B": pagination.before.bytes}

        limit = cast(int, pagination.first if pagination.first else pagination.last)
        forward = bool(pagination.last)

        response = dynamodb.query(
            TableName="links",
            KeyConditionExpression=key_condition,
            ExpressionAttributeValues=expression_values,
            ScanIndexForward=forward,
            Limit=limit,
        )

        return [self._decode(item) for item in response["Items"]]

    def _encode(self, schema: LinkSchema) -> dict[str, UniversalAttributeValueTypeDef]:
        item: dict[str, UniversalAttributeValueTypeDef] = {
            "i": {"B": schema.id.bytes},
            "u": {"B": schema.user_id.bytes},
            "s": {"S": schema.slug},
            "d": {"S": schema.destination_url},
        }

        if schema.name:
            item["n"] = {"S": schema.name}

        return item

    def _decode(self, item: dict[str, Any]) -> LinkSchema:
        id = UUID(bytes=bytes(item["i"]["B"]))
        user_id = UUID(bytes=bytes(item["u"]["B"]))
        created_at = extract_uuid_timestamp(id)
        name = item.get("n")

        return LinkSchema(
            id=id,
            user_id=user_id,
            name=name.get("S") if name else None,
            slug=item["s"]["S"],
            destination_url=item["d"]["S"],
            created_at=created_at,
        )


link_repository = LinkRepository()
