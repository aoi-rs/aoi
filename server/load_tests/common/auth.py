"""
Authentication utilities for load tests.
"""

from load_tests.config import config


def get_auth_headers(include_media_type: bool = True) -> dict[str, str]:
    headers: dict[str, str] = {}

    if include_media_type:
        headers["Content-type"] = "application/json"
        headers["Accepts"] = "application/json"

    if config.personal_access_token:
        headers["Authorization"] = f"Bearer {config.personal_access_token}"

    return headers
