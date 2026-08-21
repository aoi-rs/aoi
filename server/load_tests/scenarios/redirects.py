from locust import FastHttpUser, constant_pacing, task
from load_tests.config import config


class RedirectUser(FastHttpUser):
    """
    Simulates HTTP calls to shortened URLs
    """

    # Keep each user on a 1-second task cycle, including request time:
    #
    # request (130ms) -> wait (≈870ms) -> request (220ms) -> wait (≈780ms) -> ...
    #
    # Therefore, 10 users produce approximately 10 requests/second.
    wait_time = constant_pacing(1)

    @task
    def redirect(self):
        slug = _resolve_slug()

        with self.client.get(
            f"/{slug}",
            allow_redirects=False,
            catch_response=True,
            name="[Redirects] Resolve short URL",
        ) as response:
            if response.status_code not in (301, 308):
                response.failure(
                    f"Expected a permanent redirect. Received {response.status_code} status code."
                )

            if config.check_cloudfront_hit:
                cache_status = response.headers.get("X-Cache", "")

                if cache_status != "Hit from cloudfront":
                    response.failure(
                        f"Expected 'Hit from cloudfront'. Received: {cache_status!r}"
                    )


def _resolve_slug() -> str:
    if not config.link_slug:
        raise ValueError("Link slug is required for redirects")

    return config.link_slug
