from rinku.config import settings


def generate_slug(number: int) -> str:
    if number == 0:
        return settings.SLUG_ALPHABET[0]

    base = len(settings.SLUG_ALPHABET)
    encoded = ""

    while number:
        number, remainder = divmod(number, base)
        encoded = settings.SLUG_ALPHABET[remainder] + encoded

    return encoded
