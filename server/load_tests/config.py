"""
Load test configuration.

Environment variables:
- LOAD_TEST_LINK_SLUG: Link slug for redirect tests
"""

import os
from dataclasses import dataclass


@dataclass
class LoadTestConfig:
    link_slug: str | None = os.getenv("LOAD_TEST_LINK_SLUG")


config = LoadTestConfig()
