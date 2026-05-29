# Plan 00 — Foundation & Monorepo

## Approach

Bootstrap the workspace in a single pass: create directory scaffolding, write root config files, then configure each package/app with its own `package.json` and `tsconfig.json`. The goal is a working `pnpm install` + passing `lint` + `typecheck` before any application code exists.

---

## Step-by-Step

### 1. Init workspace

> IMPORTANT: This project is implemented **in place** at the existing repo root `/Users/spikedingo/odyssey-demo`. Do NOT create a new `odyssey-restaurant/` subdirectory. The `.specify/memory/constitution.md` and `specs/` directories already exist here — do not overwrite them. Initialize the workspace at the current root.

```bash
# Run from /Users/spikedingo/odyssey-demo (repo root)
git init        # skip if already a git repo
pnpm init       # creates root package.json (then replace per step 3)
```

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
```

### 2. Create directory skeleton

```bash
# .specify/memory and specs/ already exist — do not recreate them
mkdir -p apps/dashboard/src
mkdir -p services/backend/src
mkdir -p packages/{shared,types,ui,api-client}/src
```

### 3. Root `package.json`

```jsonc
{
  "name": "odyssey-restaurant",
  "private": true,
  "scripts": { /* see spec.md */ },
  "devDependencies": {
    "turbo": "^2.x",
    "typescript": "^5.x",
    "prettier": "^3.x",
    "@typescript-eslint/eslint-plugin": "^7.x",
    "@typescript-eslint/parser": "^7.x",
    "eslint": "^8.x",
    "eslint-plugin-import": "^2.x"
  }
}
```

### 4. `turbo.json`

Write the pipeline as specified in `spec.md`.

### 5. `tsconfig.base.json`

Write as specified in `spec.md`. All packages extend this.

### 6. `.gitignore`

```
node_modules/
dist/
.turbo/
*.env
!*.env.example
packages/api-client/src/
.wrangler/
```

Note: `packages/api-client/src/` is gitignored because it is generated. A `packages/api-client/src/.gitkeep` is NOT committed; the directory is created by the `gen:contract` script.

### 7. `packages/*` — individual package setup

Each package gets:
- `package.json` with scoped `name` (`@odyssey/<dir>`), `main`/`exports`, `scripts: { build, lint, typecheck }`, and appropriate dependencies.
- `tsconfig.json` extending `../../tsconfig.base.json`.
- `src/index.ts` placeholder export.

| Directory | Package name | Key dependencies |
|---|---|---|
| `packages/shared` | `@odyssey/shared` | none |
| `packages/types` | `@odyssey/types` | none |
| `packages/ui` | `@odyssey/ui` | `react`, `react-native`, `@odyssey/shared` (workspace) |
| `packages/api-client` | `@odyssey/api-client` | `@tanstack/react-query`, `@odyssey/types` (workspace) — rest is generated |

### 8. `services/backend` setup

```jsonc
{
  "name": "backend",
  "scripts": {
    "dev": "wrangler dev",
    "build": "wrangler deploy --dry-run --outdir dist",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "db:migrate": "drizzle-kit migrate",
    "seed": "tsx src/db/seed.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "hono": "^4.x",
    "@hono/zod-openapi": "^0.x",
    "drizzle-orm": "^0.x",
    "drizzle-zod": "^0.x",
    "postgres": "^3.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "wrangler": "^3.x",
    "drizzle-kit": "^0.x",
    "vitest": "^1.x",
    "tsx": "^4.x"
  }
}
```

`wrangler.toml`:
```toml
name = "odyssey-backend"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
NODE_ENV = "development"
```

### 9. `apps/dashboard` setup

```jsonc
{
  "name": "dashboard",
  "scripts": {
    "dev": "expo start --web",
    "build": "expo export --platform web",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "test": "jest --passWithNoTests"
  },
  "dependencies": {
    "expo": "^51.x",
    "expo-router": "^3.x",
    "react": "^18.x",
    "react-native": "^0.74.x",
    "react-native-web": "^0.19.x",
    "@tanstack/react-query": "^5.x",
    "lucide-react-native": "^0.x",
    "@odyssey/ui": "workspace:*",
    "@odyssey/api-client": "workspace:*",
    "@odyssey/shared": "workspace:*",
    "@odyssey/types": "workspace:*"
  }
}
```

> **Package naming convention (canonical)**: every workspace package uses the `@odyssey/` scope in its `package.json` `name` field. Directory `packages/ui` → package name `@odyssey/ui`; `packages/types` → `@odyssey/types`; `packages/shared` → `@odyssey/shared`; `packages/api-client` → `@odyssey/api-client`. All cross-package imports and `workspace:*` deps use the scoped name (e.g. `import { Button } from '@odyssey/ui'`), never the directory path. `services/backend` and `apps/dashboard` keep unscoped names (`backend`, `dashboard`) since they are not imported as packages.

### 10. `docker-compose.yml`

Write as specified in `spec.md`.

### 11. `.env.example` files

Write for `services/backend` and `apps/dashboard` as specified in `spec.md`.

### 12. Prettier and ESLint

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100
}
```

Root `.eslintrc.js` with `@typescript-eslint/recommended` preset.

### 13. README skeleton

Write `README.md` with:
- Project overview
- Prerequisites (Node 20+, pnpm 9+, Docker)
- Quick start: `pnpm install && pnpm db:up && pnpm db:migrate && pnpm seed && pnpm dev:backend & pnpm dev:dashboard`
- Links to further docs in `/specs`

---

## Key Decisions & Rationale

| Decision | Rationale |
|---|---|
| `packages/api-client/src/` gitignored | Generated code should not be committed; regenerated by CI and devs via `gen:contract` |
| `packages/types` as separate package | Allows `services/backend` to reference shared enum values without pulling in API-client or UI code |
| `nodejs_compat` flag in wrangler | Required for Drizzle's `postgres` driver in Workers (uses Node.js APIs) |
| Expo Router for navigation | Natural for Expo + web parity; file-system routing reduces boilerplate |
| `DATABASE_URL` only env var for backend | Simplest possible local setup; everything else is defaults |
