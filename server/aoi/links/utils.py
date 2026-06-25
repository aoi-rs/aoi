from aoi.config import settings
from uuid import UUID
from datetime import datetime, UTC


def generate_slug(number: int) -> str:
    if number == 0:
        return settings.SLUG_ALPHABET[0]

    base = len(settings.SLUG_ALPHABET)
    encoded = ""

    while number:
        number, remainder = divmod(number, base)
        encoded = settings.SLUG_ALPHABET[remainder] + encoded

    return encoded


def extract_uuid_timestamp(id: UUID) -> datetime:
    return datetime.fromtimestamp(id.time / 1000, UTC)
