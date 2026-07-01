import base64
import hashlib
import hmac
import secrets

from uuid import UUID
from dataclasses import dataclass


def generate_refresh_token_hmac_key() -> bytes:
    return secrets.token_bytes(32)


REFRESH_TOKEN_CHECKSUM_LENGTH = 4
REFRESH_TOKEN_SIGNATURE_LENGTH = 16

MIN_REFRESH_TOKEN_LENGTH = (
    1  # version byte
    + 16  # UUID bytes
    + 1  # minimum variant size
    + REFRESH_TOKEN_SIGNATURE_LENGTH
    + REFRESH_TOKEN_CHECKSUM_LENGTH
)

MAX_REFRESH_TOKEN_LENGTH = MIN_REFRESH_TOKEN_LENGTH + 8


class RefreshTokenParseError(Exception): ...


class RefreshTokenLengthError(RefreshTokenParseError):
    def __init__(self):
        super().__init__("refresh token length is not valid")


class RefreshTokenUnknownVersionError(RefreshTokenParseError):
    def __init__(self):
        super().__init__("refresh token version is not 0")


class RefreshTokenInvalidChecksumError(RefreshTokenParseError):
    def __init__(self):
        super().__init__("refresh token checksum is not valid")


class RefreshTokenInvalidCounterError(RefreshTokenParseError):
    def __init__(self):
        super().__init__("refresh token's counter is not valid")


def _append_uvarint(buf: bytearray, value: int) -> bytearray:
    """
    Encodes an unsigned integer using variable-length integer
    encoding (u64-style varint) and appends it to a byte buffer.
    """

    while value >= 0x80:
        # Write lower 7 bits and set continuation bit
        buf.append((value & 0x7F) | 0x80)

        # Shift away consumed bits
        value >>= 7

    # Final byte without continuation bit
    buf.append(value)

    return buf


def _decode_uvarint(buf: bytes) -> tuple[int, int]:
    """
    Decodes an unsigned variable-length integer (u64-style varint)
    from a byte buffer.

    Returns:
        tuple[int, int]

        (value, bytes_read)

    Return semantics:
        bytes_read > 0:
            Success.
            `value` contains the decoded integer.

        bytes_read == 0:
            Buffer ended before varint was fully decoded.

        bytes_read < 0:
            Overflow occurred.
            The decoded value exceeds the maximum size
            supported by unsigned 64-bit integers (u64).

      Python integers are arbitrary precision and do not
      overflow naturally like Rust's `u64`.

      Overflow checks are implemented manually to preserve
      strict protocol semantics compatible with systems
      languages like Rust.
    """

    result = 0
    shift = 0

    for i, byte in enumerate(buf):
        # Extract lower 7 bits and place them into result.
        result |= (byte & 0x7F) << shift

        # Highest bit NOT set:
        # this is the final varint byte.
        if (byte & 0x80) == 0:
            return result, i + 1

        shift += 7

        # More than 64 bits would overflow a u64.
        if shift >= 64:
            return 0, -1

    # Buffer ended before varint completed.
    return 0, 0


MAX_INT64 = 2**63 - 1


def _safe_int64(value: int) -> int:
    if value > MAX_INT64:
        return MAX_INT64

    return value


MAX_UINT64 = (1 << 64) - 1


def _safe_uint64(value: int) -> int:
    if value < 0:
        return 0

    if value > MAX_UINT64:
        return MAX_UINT64

    return value


@dataclass
class RefreshToken:
    version: int
    session_id: UUID
    counter: int
    signature: bytes = b""
    raw: bytes = b""

    def check_signature(self, hmac_sha256_key: bytes) -> bool:
        bytes_ = self.raw[
            : -REFRESH_TOKEN_SIGNATURE_LENGTH - REFRESH_TOKEN_CHECKSUM_LENGTH
        ]

        print(f"{hmac_sha256_key} used to check signature")

        signature = hmac.new(hmac_sha256_key, bytes_, hashlib.sha256).digest()[
            :REFRESH_TOKEN_SIGNATURE_LENGTH
        ]

        return hmac.compare_digest(signature, self.signature)

    def encode(self, hmac_sha256_key: bytes) -> str:
        result = bytearray()

        result.append(0)
        result.extend(self.session_id.bytes)
        result = _append_uvarint(result, _safe_uint64(self.counter))

        # Quick note on truncating the HMAC-SHA-256 output:
        # This does not impact security as the brute force space is 2^128 and
        # the collision space is 2^64, both unattainable in practice

        signature = hmac.new(hmac_sha256_key, result, hashlib.sha256).digest()[
            :REFRESH_TOKEN_SIGNATURE_LENGTH
        ]

        result.extend(signature)

        checksum = hashlib.sha256(result).digest()[:REFRESH_TOKEN_CHECKSUM_LENGTH]

        result.extend(checksum)

        self.version = 0
        self.raw = bytes(result)
        self.signature = signature

        return base64.urlsafe_b64encode(result).decode().rstrip("=")


def parse_refresh_token(refresh_token: str) -> RefreshToken:
    bytes_ = base64.urlsafe_b64decode(refresh_token + "===")

    if len(bytes_) < MIN_REFRESH_TOKEN_LENGTH:
        raise RefreshTokenLengthError()

    if bytes_[0] != 0:
        raise RefreshTokenUnknownVersionError()

    checksum256 = hashlib.sha256(bytes_[:-REFRESH_TOKEN_CHECKSUM_LENGTH]).digest()

    if not hmac.compare_digest(
        checksum256[:REFRESH_TOKEN_CHECKSUM_LENGTH],
        bytes_[-REFRESH_TOKEN_CHECKSUM_LENGTH:],
    ):
        raise RefreshTokenInvalidChecksumError()

    parse_from = bytes_[1:-REFRESH_TOKEN_CHECKSUM_LENGTH]

    session_id = UUID(bytes=parse_from[:16])
    parse_from = parse_from[16:]

    counter, counter_bytes = _decode_uvarint(parse_from)

    if counter_bytes <= 0:
        raise RefreshTokenInvalidCounterError()

    parse_from = parse_from[counter_bytes:]

    if len(parse_from) != 16:
        raise RefreshTokenLengthError()

    signature = parse_from

    return RefreshToken(
        raw=bytes_,
        version=0,
        session_id=session_id,
        counter=_safe_int64(counter),
        signature=signature,
    )
