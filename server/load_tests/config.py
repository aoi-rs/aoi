"""
Load test configuration.

Environment variables:
- LOAD_TEST_LINK_SLUG: Existing link slug for redirect tests
"""

import os
from dataclasses import dataclass


@dataclass
class LoadTestConfig:
    link_slug: str | None = os.getenv("LOAD_TEST_LINK_SLUG")
    check_cloudfront_hit: bool = (
        os.getenv("LOAD_TEST_CHECK_CLOUDFRONT_HIT", "").lower() == "true"
    )


config = LoadTestConfig()
