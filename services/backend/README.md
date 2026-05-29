# Backend Service

## Local Database

Default: Docker Postgres via `pnpm db:up` from repo root.

`DATABASE_URL=postgresql://odyssey:odyssey@localhost:5432/odyssey`

## Switching to Neon

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string from the Neon dashboard.
3. Update `services/backend/.env`: `DATABASE_URL=<neon-connection-string>?sslmode=require`
4. No code changes required — Drizzle uses `DATABASE_URL` directly.
5. Skip `pnpm db:up`; Neon is always-on.
