# Changelog

## 0.4.0

- Added typed results for every Maildrop GraphQL operation.
- Added the `ping` operation and complete message fields.
- Added `MaildropApiError` for GraphQL errors.
- Added configurable endpoint, fetch implementation, and request timeout options.
- Added validation for required mailbox and message identifiers.
- Added typed HTTP, response, and timeout errors.
- Added the shared `MaildropError` base class for programmatic error handling.
- Added request cancellation safety and optional variables for status/statistics/ping.
- Added opt-in live API contract tests.
- Added the public `MaildropClient` type and published source files for declaration maps.
- Added a `User-Agent` header and documented delete semantics and GraphQL compatibility.
- Preserved the existing `Maildrop()` factory and method variable shapes.

## 0.3.0

- Modernized the development toolchain and moved package management to pnpm.
