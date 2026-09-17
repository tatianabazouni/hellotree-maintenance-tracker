# Hellotree Maintenance Tracker API

A compact TypeScript/Express REST API for clients to submit website and app maintenance requests and admins to manage their lifecycle. Prisma provides PostgreSQL persistence; a simple demo-user header enforces client/admin access for the take-home flow; the service layer owns the lifecycle and urgency rules.

## Requirements

Node.js 20+ and PostgreSQL 14+. Create a database named `maintenance_tracker` (or use any PostgreSQL URL you control).

## Setup

```bash
cp .env.example .env
# Edit DATABASE_URL if your PostgreSQL connection differs.
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

The API listens on `http://localhost:3000` by default. `CORS_ORIGIN` controls the permitted frontend origin. Production startup uses `npm run build && npm start`.

## Scripts

- `npm run dev` — watch-mode server.
- `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format:check` — quality checks.
- `npm test` — deterministic HTTP behavior suite with an isolated in-memory repository (it never modifies your development database).
- `npm run db:deploy` — apply committed PostgreSQL migrations.
- `npm run db:seed` — insert predictable demo records.

## Demo users

- Admin: `admin@example.com`
- Clients: `alice@example.com`, `bob@example.com`, `carla@example.com`

Use `GET /api/auth/users` to retrieve their IDs, then send `X-Demo-User-Id: <id>` on protected requests. There are no passwords, sessions, or JWTs.

## Architecture

- `src/app.ts` configures Express and routes.
- `src/controllers` parses HTTP concerns; `src/services` enforces domain rules.
- `src/repositories` maps the repository interface to Prisma/PostgreSQL.
- `src/middleware` provides auth, roles, and centralized errors.
- `prisma` contains the reproducible schema, SQL migration, and deterministic seed.
- `docs/API.md` is the frontend integration contract.

## Frontend integration

Set the frontend API base to `http://localhost:3000/api`. The React app uses `/auth/users` for the hardcoded demo user switch and sends the selected user ID in `X-Demo-User-Id`. Clients use `/requests`; administrators use `/admin/requests` and the status patch endpoint. Responses always wrap payloads in `data`, while errors always wrap `code` and `message` in `error`. See [the API contract](docs/API.md) for all request bodies and rules.
