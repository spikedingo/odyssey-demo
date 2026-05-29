# Plan 04 — Contract Generation Pipeline

## Approach

The pipeline has two phases: (1) backend emits OpenAPI JSON to a file, (2) Orval reads the file and regenerates `packages/api-client/src/generated/`. Both phases run sequentially under `pnpm gen:contract`. The key design choice is writing OpenAPI to a static file (not requiring a running server) for reliability in CI.

---

## Step-by-Step

### 1. Backend OpenAPI export script

Add `src/openapi-export.ts` to `services/backend`:

```ts
// src/openapi-export.ts
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { app } from './index';  // the OpenAPIHono app instance

// OpenAPIHono exposes getOpenAPIDocument()
const doc = app.getOpenAPIDocument({
  openapi: '3.0.0',
  info: { title: 'Odyssey Restaurant API', version: '1.0.0' },
});

const outPath = resolve(__dirname, '../../openapi.json');
writeFileSync(outPath, JSON.stringify(doc, null, 2));
console.log(`OpenAPI spec written to ${outPath}`);
```

Add script to `services/backend/package.json`:
```json
"build:openapi": "tsx src/openapi-export.ts"
```

### 2. `packages/types` content

Write `packages/types/src/index.ts` with:
- `OrderStatus` union type.
- `ORDER_STATUS_LABELS` display map.
- `VALID_TRANSITIONS` map (for frontend display of available actions).
- Any other shared enums needed before generation (e.g., `DensityLevel`).

This package has no dependencies and builds trivially.

### 3. Orval configuration

Install Orval in `packages/api-client`:
```bash
pnpm --filter=api-client add -D orval
```

Write `packages/api-client/orval.config.ts` as specified in `spec.md`.

Key config choices:
- `mode: 'tags-split'` — one file per resource tag, clean imports.
- `client: 'react-query'` — generates `useQuery` / `useMutation` hooks.
- `httpClient: 'fetch'` — no axios dependency.
- Custom mutator `src/customFetch.ts` — injects base URL from env.

### 4. Custom fetch wrapper

```ts
// packages/api-client/src/customFetch.ts
export const customFetch = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8787';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiClientError(response.status, errorBody);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}`);
  }
}
```

### 5. `packages/api-client/src/index.ts`

```ts
// Re-export generated artifacts
export * from './generated/endpoints/orders';
export * from './generated/endpoints/customers';
export * from './generated/endpoints/menuItems';
export * from './generated/endpoints/categories';
export * from './generated/endpoints/settings';
export * from './generated/endpoints/home';
export * from './generated/model/order';
export * from './generated/model/customer';
export * from './generated/model/menuItem';
// ... etc
export { customFetch, ApiClientError } from './customFetch';
```

This file is hand-written and committed; it imports from generated files which are gitignored but must exist locally after `gen:contract`.

### 6. Root `gen:contract` wiring

In root `package.json` scripts:
```json
"gen:contract": "pnpm --filter=backend run build:openapi && pnpm --filter=api-client exec orval && pnpm --filter=api-client run typecheck"
```

Turbo pipeline (`turbo.json`) entry for `generate`:
```json
"generate": {
  "dependsOn": ["^build:openapi"],
  "outputs": ["src/generated/**"]
}
```

### 7. `.gitignore` additions

```
# Root .gitignore
openapi.json
packages/api-client/src/generated/
```

`packages/api-client/src/customFetch.ts` — committed (hand-written).
`packages/api-client/src/index.ts` — committed (hand-written barrel).

### 8. CI/freshness check

Add a script to verify generated files are up to date:
```bash
# In CI: gen:contract, then check git diff
pnpm gen:contract
git diff --exit-code packages/api-client/src/generated
```

If the generated output differs, fail the CI step with a message to run `pnpm gen:contract` and commit.

> Note: since `src/generated/` is gitignored, the CI check is: re-generate, then typecheck. If typecheck fails, the spec is stale.

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Static file export (not running server) | More reliable in CI; doesn't require port binding |
| `tags-split` mode | One file per resource → clean, focused imports in components |
| Custom fetch mutator (not axios) | Fewer dependencies; Expo web supports native `fetch` |
| `packages/types` for `OrderStatus` | Needed before generation (e.g., seed script, service layer); avoids circular dep |
| `VALID_TRANSITIONS` in `packages/types` | Frontend can show available actions without waiting for an API call |
| Index.ts barrel committed | Stable import path; regeneration only changes contents of `generated/` |
