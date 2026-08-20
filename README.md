# Simple Maildrop

A simple TypeScript library for interacting with the Maildrop API.
Get more information about the Maildrop service at [maildrop.cc](https://maildrop.cc/).

## Requirements

- Node.js 24 or newer
- pnpm 11 or newer for local development

## Installation

Install with pnpm:

```bash
pnpm add simple-maildrop
```

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
const statistics = await maildrop.getStatistics({});

// Get status
const status = await maildrop.getStatus({});
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
