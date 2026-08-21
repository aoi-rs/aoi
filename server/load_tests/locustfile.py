"""
Main Locust load test file.

Commands:
    # interactive mode with web UI
    uv run task loadtest

    # run redirects scenario
    locust -f load_tests/locustfile.py --host http://127.0.0.1:8000 \
            --users 5 --spawn-rate 1 --run-time 5m RedirectUser

    Environment variables:
        See load_tests/config.py for configuration options
"""

from load_tests.scenarios import RedirectUser

__all__ = ["RedirectUser"]
