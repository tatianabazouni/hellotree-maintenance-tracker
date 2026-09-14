# Hellotree Maintenance Tracker API

A compact TypeScript/Express REST API for clients to submit maintenance requests and admins to manage their lifecycle. Prisma provides PostgreSQL persistence; JWT middleware enforces client/admin access; the service layer owns the lifecycle and urgency rules.

## Requirements

Node.js 20+ and PostgreSQL 14+. Create a database named `maintenance_tracker` (or use any PostgreSQL URL you control).

## Setup

```bash
cp .env.example .env
# Edit DATABASE_URL and replace JWT_SECRET with a long random value.
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

The API listens on `http://localhost:3000` by default. `CORS_ORIGIN` controls the permitted Lovable frontend origin. Production startup uses `npm run build && npm start`.

## Scripts

- `npm run dev` — watch-mode server.
- `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format:check` — quality checks.
- `npm test` — deterministic HTTP behavior suite with an isolated in-memory repository (it never modifies your development database).
- `npm run db:deploy` — apply committed PostgreSQL migrations.
- `npm run db:seed` — insert predictable demo records.

## Demo credentials

All seeded users use password `Password123!`:

- Admin: `admin@example.com`
- Clients: `alice@example.com`, `bob@example.com`, `carla@example.com`

## Architecture

- `src/app.ts` configures Express and routes.
- `src/controllers` parses HTTP concerns; `src/services` enforces domain rules.
- `src/repositories` maps the repository interface to Prisma/PostgreSQL.
- `src/middleware` provides auth, roles, and centralized errors.
- `prisma` contains the reproducible schema, SQL migration, and deterministic seed.
- `docs/API.md` is the frontend integration contract.

## Lovable integration

Set the frontend API base to `http://localhost:3000/api`. Login at `/auth/login`, store the returned token, and send it as `Authorization: Bearer <token>`. Clients use `/requests`; administrators use `/admin/requests` and the status patch endpoint. Responses always wrap payloads in `data`, while errors always wrap `code` and `message` in `error`. See [the API contract](docs/API.md) for all request bodies and rules.
