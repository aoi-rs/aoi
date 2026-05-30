from rinku.config import settings


def generate_slug(number: int) -> str:
    if number == 0:
        return settings.SLUG_ALPHABET[0]

    encoded = ""

    while number:
        number, remainder = divmod(number, 62)
        encoded = settings.SLUG_ALPHABET[remainder] + encoded

    return encoded
