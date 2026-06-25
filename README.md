# aoi.rs

URL shortener built with bold scalability requirements and a minimal feature set:

- Authentication
- Personal Access Tokens (PATs)
- Short URL creation
- Short URL pagination
- Redirects (short URL -> destination URL)

## Requirements

### Functional Requirements

- Users should be able to log in using a one-time email code
- Users should be able to view and edit their profiles (email and an optional name)
- Users should be able to view their active auth sessions and revoke them
- Users should be able to manage their Personal Access Tokens (PATs) and use them to access the REST API
- Users should be able to create short URLs
- Users should be able to list their short URLs
- The application should redirect requests to short URLs to their destination URLs

## Non-Functional Requirements

- The application should support 10 million registered users
- The application should support 100 million short URLs created daily
- The ratio of read operations and write operations is 10:1 
- The short URLs should be stored for at least 10 years 
- The short URL slugs should consist only of [Base62](https://en.wikipedia.org/wiki/Base62) characters
- The short URLs should be as small as possible

## Business Rules

- Auth sessions, PATs, and short URLs are account-scoped, so only their owner can manage them 
- The destination URL of a short URL cannot be modified or deleted. Since the application also doesn't track redirect metrics, every redirect can safely return [HTTP 308 Permanent Redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/308)
