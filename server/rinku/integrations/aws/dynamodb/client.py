import boto3

from typing import TYPE_CHECKING
from rinku.config import settings

if TYPE_CHECKING:
    from mypy_boto3_dynamodb import DynamoDBServiceResource


# https://github.com/microsoft/pylance-release/issues/2809#issuecomment-1126267059
# boto3-stubs doesn't have all the types needed by boto3.resource overload...
def create_client() -> "DynamoDBServiceResource":
    return boto3.resource(  # pyright: ignore[reportUnknownMemberType]
        "dynamodb",
        endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )


dynamodb = create_client()

__all__ = ("dynamodb", "create_client")
