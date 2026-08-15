from boto3.session import Session
from typing import TYPE_CHECKING
from aoi.config import settings

if TYPE_CHECKING:
    from mypy_boto3_dynamodb import DynamoDBClient


def create_client() -> "DynamoDBClient":
    session = Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )

    # https://github.com/microsoft/pylance-release/issues/2809#issuecomment-1126267059
    # boto3-stubs doesn't have all the types needed by session.client overload...
    return session.client(  # pyright: ignore[reportUnknownMemberType]
        "dynamodb",
        endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
    )


dynamodb = create_client()


__all__ = ("create_client", "dynamodb")
