"""
Load test configuration.

Environment variables:
- LOAD_TEST_HOST: Base URL of the API (default: http://127.0.0.1:8000)
- LOAD_TEST_PERSONAL_ACCESS_TOKEN: Personal access token for authenticated requests
- LOAD_TEST_LINK_SLUG: Link slug for redirect tests
"""

import os
from dataclasses import dataclass


@dataclass
class LoadTestConfig:
    host: str = os.getenv("LOAD_TEST_HOST", "http://127.0.0.1:8000")
    personal_access_token: str | None = os.getenv("LOAD_TEST_PERSONAL_ACCESS_TOKEN")
    link_slug: str | None = os.getenv("LOAD_TEST_LINK_SLUG")


config = LoadTestConfig()
