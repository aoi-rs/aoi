# Redirect load test

The redirect scenario measures the response from the public Aoi hostname without
following the redirect to its destination. This keeps destination-server latency
out of the results.

Use a slug that exists in production and warm it once before the measured run:

```bash
curl -sS -D - -o /dev/null https://aoi.rs/2tx
mkdir -p load_tests/results

LOAD_TEST_HOST=https://aoi.rs \
LOAD_TEST_LINK_SLUG=2tx \
uv run locust -f load_tests/locustfile.py \
  --headless --users 10 --spawn-rate 2 --run-time 5m \
  --reset-stats --only-summary \
  --csv load_tests/results/redirect \
  --html load_tests/results/redirect.html
```

Each simulated user sends approximately one request per second by default. Set
`LOAD_TEST_REQUEST_INTERVAL` to change that pacing. For example, `0.5` targets
approximately two requests per second per user.

The expected response is `301` with a non-empty `Location` header. Override the
status with `LOAD_TEST_REDIRECT_STATUS` if the production redirect intentionally
uses another status.

Locust prints latency percentiles in its final summary. The generated
`redirect_stats.csv` and HTML report include P50, P95, P99, request rate, and
failure information. Create `load_tests/results` before requesting reports.
