# Create a server-runtime-agnostic package

Date: 2022-05-19

Status: proposed

## Context

We have three server runtime packages:
- `@remix-run/cloudflare`
- `@remix-run/deno`
- `@remix-run/node`

Each of these re-exports a bunch of values and functions from `@remix-run/server-runtime`.

Each also uses server runtime authoring utilities from `@remix-run/server-runtime` to implement things like `createCookie` in a runtime-specific way.

Currently, we recommend that users import all server-related values and functions from their server runtime package, for example:

```tsx
import { json } from "@remix-run/node";
```

Most of these imports are runtime-agnostic, like `json`.

Importing runtime-agnostic values and functions through a specific server runtime package makes user code in `app/` **less portable**; users would have to change those imports if they change their server runtime.

Additionally, maintaining parity for re-exports across all server runtime packages is tedious and error-prone (for example, [having to patch in more re-exports in `@remix-run/deno`](https://github.com/remix-run/remix/pull/3215)).

## Decision

Separate `@remix-run/server-runtime` into two packages:
- `@remix-run/server-runtime-toolkit`: utilities for authoring server runtime packages (e.g. `createCookieFactory`)
- `@remix-run/server`: provides runtime-agnostic values and function (e.g. `json`)

Specific package names TBD (`@remix-run/server` might be confusing with `@remix-run/serve` already existing and doing something categorically different).

`@remix-run/server-runtime-toolkit` should not be considered public API, while `@remix-run/server` should be.

## Consequences

### How to import from Remix server packages

Users would import runtime-agnostic values and functions from `@remix-run/server`:

```tsx
import { json } from "@remix-run/server";
```

Users would continue to import runtime-specific values and functions from their corresponding server runtime package:

```tsx
import { createCookie } from "@remix-run/node";
```

While this might be viewed as more to learn for beginners, it is more transparent and less mysterious than importing re-exported values and functions, improving DX.

### Better portability

User code in `app/` would be more portable and easier to migrate to different server runtimes.
Most imports could be left as-is, and a simple `grep` for usages for your server runtime package would highlight all places that need to be manually migrated. For example:

```sh
grep -nri "@remix-run/node" app/
```

### Better maintainability for Remix packages

Without re-exports, each server runtime package's API surface area decreases dramatically.

We could also eliminate tests that check for re-exports and stop manual efforts to keep re-exports consistent.
