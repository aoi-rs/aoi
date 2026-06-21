# Rinku

Rinku (リンク) comes from the katakanized pronunciation of “link”. Rinku is a link shortener built with bold scalability requirements and a very small feature set:

- Authentication
- Create short links
- List your links
- Redirect

That's it. Just a fast service designed to do one thing well: shorten links and redirect people without drama.

## Requirements

### Functional Requirements 

- Users should be able to login via email code / magic link
- Users should be able to get their profile, including email and an optional name 
- Users should be able to manage their account sessions, including list their sessions and revoke sessions 
- Users should be able to create short URLs scoped at their account-level 
- Users should be able to list their account's short URLs
- The application should redirect requests to short URLs to their destination URLs

## Non-Functional Requirements

- The application should support 10.000.000 (10 Million) registered users
- The application should support 100.000.000 (100 million) short URLs created daily
- The ratio of read operations and write operations is 10:1 
- The short URLs should be stored for at least 10 years 
- The short URL slugs should allow only base 62 characters 
- The short URLs should be as small as possible 

## Business Rules 

- Of course, sessions and short URLs are account-level so only the specific user can manage them 
- The destination URL of short URLs can't be updated. This allows the application to use the 301 status code as it doesn't need to track clicks or handle updated destination URLs.
