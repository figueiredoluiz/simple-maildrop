# Package compatibility contracts

The compatibility suite protects the public behavior of historical
`simple-maildrop` package releases. It is intentionally separate from the live
Maildrop API tests and current behavior tests, so a future refactor cannot
accidentally remove an older package method or change its call shape.

The current matrix contains the `simple-maildrop` `0.2.0` and `0.3.0` package
contracts. To support another historical package release, add it to
`tests/compatibility/versions.ts`; the shared contract suite will run the same
checks for that release.

Each package contract verifies:

- exposed legacy methods;
- original variable names and shapes;
- the Maildrop GraphQL endpoint and request variables; and
- direct return of the GraphQL `data` payload.

These are package-release baselines, not Maildrop server API versions. The
separate `tests/maildrop.integration.test.ts` file exercises the live Maildrop
API schema.

The suite tests public behavior, not the HTTP library used internally. The move
from Axios to native `fetch` therefore does not require preserving Axios as a
dependency.

Run the compatibility suite directly with:

```bash
pnpm exec vitest run tests/compatibility/contract.test.ts
```
