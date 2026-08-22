# Simple Maildrop

A simple TypeScript library for interacting with the Maildrop API.
Get more information about the Maildrop service at [maildrop.cc](https://maildrop.cc/).

This package is a small, dependency-free client for Maildrop's GraphQL API. It
uses the platform `fetch` implementation and exposes typed results for every
operation in the public schema.

## Requirements

- Node.js 24 or newer
- pnpm 11 or newer for local development

## Installation

Install with pnpm:

```bash
pnpm add simple-maildrop
```

## API

The query and mutation documents mirror the official
[Maildrop GraphQL API schema](https://docs.maildrop.cc/api-reference/graphql-api-schema).

| Function | Variables | Result |
| --- | --- | --- |
| `getMailbox` | `{ mailbox }` | `{ inbox }` with message metadata |
| `getMessage` | `{ mailbox, id }` | `{ message }` with full content |
| `deleteMessage` | `{ mailbox, id }` | `{ delete }` — accepted for deletion, not proof the message existed |
| `getAltInbox` | `{ mailbox }` | `{ altinbox }` |
| `getStatistics` | none | `{ statistics }` |
| `getStatus` | none | `{ status }` |
| `ping` | `{ message? }` | `{ ping }` |

All response and variable types are exported from the package entry point.
GraphQL failures throw `MaildropApiError` (including any partial data), HTTP
failures throw `MaildropHttpError`, invalid responses throw
`MaildropResponseError`, and timeouts throw `MaildropTimeoutError`.

```typescript
import Maildrop, { MaildropApiError, MaildropError, type Message } from 'simple-maildrop';

const { inbox }: { inbox: Message[] | null } =
  await Maildrop().getMailbox({ mailbox: 'test' });

try {
  await Maildrop().getMessage({ mailbox: 'test', id: 'missing' });
} catch (error) {
  if (error instanceof MaildropError) {
    console.error('Maildrop request failed', error);
  }

  if (error instanceof MaildropApiError) {
    console.error(error.errors);
  }
}
```

`MaildropError` is the common base class for `MaildropApiError`,
`MaildropHttpError`, `MaildropResponseError`, and `MaildropTimeoutError`. Use it
when handling any error produced by this client.

## Compatibility

Existing method names and variable shapes are kept stable. New operations and
response fields are added without removing existing fields. Breaking changes
will be introduced only with an explicit deprecation period and migration
notes. Since `0.4.0`, GraphQL responses containing an `errors` array throw
`MaildropApiError`, even when partial data is also present; inspect the error's
`data` property when handling partial responses.

Historical `simple-maildrop` package contracts are maintained in the
[package compatibility test matrix](docs/compatibility.md). The current matrix
covers the `0.2.0` and `0.3.0` package methods, parameters, requests, and
outputs. Live Maildrop API validation is maintained separately in the
integration test suite.

## Client options

The existing `Maildrop()` call needs no changes. Optional client settings can
be supplied when needed:

```typescript
const maildrop = Maildrop({
  endpoint: 'https://api.maildrop.cc/graphql',
  timeout: 10_000,
});
```

The client uses the global `fetch` by default. Supplying `fetch` is useful for
tests or applications with a custom transport. Requests time out after ten
seconds by default.

`html` and `data` contain message content supplied by email senders. Treat both
fields as untrusted input and sanitize them before rendering.

## Usage

First, import the `Maildrop` function from the `simple-maildrop` package:

```typescript
import Maildrop from 'simple-maildrop';
```

Then, create a new `Maildrop` instance:

```typescript
const maildrop = Maildrop();
```

You can now use the `Maildrop` instance to interact with the Maildrop API:

```typescript
// Get a mailbox
const mailbox = await maildrop.getMailbox({ mailbox: 'test' });

// Get a message
const message = await maildrop.getMessage({ mailbox: 'test', id: '1' });

// Delete a message
const deleteResult = await maildrop.deleteMessage({ mailbox: 'test', id: '1' });

// Get an alternative inbox
const altInbox = await maildrop.getAltInbox({ mailbox: 'test' });

// Get statistics
const statistics = await maildrop.getStatistics();

// Get status
const status = await maildrop.getStatus();

// Check API connectivity
const ping = await maildrop.ping({ message: "hello" });
```

## Development

Install the development dependencies and run the validation suite with pnpm:

```bash
pnpm install
pnpm test
pnpm run typecheck
pnpm run lint
pnpm run format:check
```

Build the package with:

```bash
pnpm run build
```

Run the live contract checks manually when network access is available:

```bash
MAILDROP_LIVE_TEST=1 pnpm exec vitest run tests/maildrop.integration.test.ts
```

These tests call the non-mutating API operations only; the destructive delete
mutation is intentionally excluded. The normal test suite remains
deterministic and does not contact the Maildrop service.
