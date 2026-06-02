# Redirector Service

The Redirector Service is a dedicated service responsible for handling link redirects in Rinku.

Today, redirects are handled by the main API, which is responsible for authentication, link creation, and other platform features. However, redirects have different performance, scaling, and infrastructure requirements. To better support these needs, Rinku introduces a separate Redirector Service focused exclusively on serving redirects.

## Motivation

Redirects are Rinku's hottest path and require a different architecture from the main API.

Some of the reasons for separating redirect traffic include:

- Independent scaling based on redirect traffic volume.
- The ability to use a CDN to cache redirect responses and reduce origin load.
- Simpler deployment and optimization of redirect-specific infrastructure.
- Flexibility to support dedicated redirect domains, such as `rk.sh` or other short domains, in the future.
- Isolation from the main API, ensuring redirect traffic does not compete with authentication and link management workloads.

Because of these requirements, the redirect architecture includes:

- A dedicated ECS service.
- A dedicated ALB Target Group.
- CloudFront in front of the redirect service to cache redirect responses.
- Host-based routing at the ALB level.

## Tech Stack

The Redirector Service is written in Rust and optimized for high throughput and low latency.

Its primary responsibility is simple:

1. Receive a short link slug.
2. Resolve the destination URL.
3. Return the appropriate HTTP redirect response as quickly as possible.

By keeping the service focused on a single responsibility, Rinku can optimize redirect performance independently from the rest of the platform.
