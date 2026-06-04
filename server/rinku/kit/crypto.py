import string
import secrets
import zlib
import hmac
import hashlib

BASE62_ALPHABET = string.ascii_letters + string.digits


def _crc32_to_base62(number: int) -> str:
    encoded = ""

    while number:
        number, remainder = divmod(number, 62)
        encoded = BASE62_ALPHABET[remainder] + encoded

    return encoded.zfill(6)


def generate_token(*, prefix: str = "") -> str:
    """
    Generates a token suitable for sensitive values like API tokens.
    """

    token = "".join(secrets.choice(BASE62_ALPHABET) for _ in range(37))

    checksum = zlib.crc32(token.encode("utf-8")) & 0xFFFFFFFF
    checksum_base62 = _crc32_to_base62(checksum)

    return f"{prefix}{token}{checksum_base62}"


def generate_token_hash(token: str, *, secret: str) -> str:
    """
    Generates a HMAC-SHA256 hash suitable for sensitive tokens.
    Remember to store this hash instead of the actual value in database.
    """

    hash = hmac.new(secret.encode("ascii"), token.encode("ascii"), hashlib.sha256)
    return hash.hexdigest()
