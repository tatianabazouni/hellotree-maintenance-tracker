# Maintenance Tracker API

Base URL: `http://localhost:3000/api`. Every response is `{ "data": ... }`; failures are `{ "error": { "code", "message" } }` (validation errors also include `details`). Send `Authorization: Bearer <token>` after login.

## Authentication

### `POST /auth/login` (public)

Body: `{ "email": "alice@example.com", "password": "Password123!" }`.
Returns `{ "data": { "token": "jwt", "user": { "id", "name", "email", "role" } } }`. Invalid credentials return `401 INVALID_CREDENTIALS`.

## Request object

`id`, `title`, `description`, `status` (`NEW`, `IN_PROGRESS`, `DONE`), `createdAt`, `updatedAt`, `resolutionNote`, `resolvedAt`, and `isUrgent`. Admin responses also contain `client: { id, name, email }`. Timestamps are UTC ISO-8601 strings. `isUrgent` is true only for a `NEW` request created more than 24 hours ago.

## Client endpoints

- `GET /requests` — client only: lists only their own requests.
- `POST /requests` — client only. Body: `{ "title": "Leaking faucet", "description": "Kitchen faucet drips continuously." }`. Returns `201`. The API sets owner and `NEW` status; protected fields are rejected.
- `GET /requests/:id` — authenticated. Clients receive only their own request; another client’s ID returns `404`.

## Admin endpoints

- `GET /admin/requests?status=NEW&clientId=<uuid>` — admin only. Both filters are optional and combine when supplied. Invalid filters return `400`.
- `GET /admin/requests/:id` — admin only.
- `PATCH /requests/:id/status` — admin only. Body: `{ "status": "IN_PROGRESS" }` or `{ "status": "DONE", "resolutionNote": "Replaced the faulty valve." }`.

Only `NEW → IN_PROGRESS → DONE` is allowed. Invalid transitions return `409 INVALID_STATUS_TRANSITION`. `DONE` requires a non-whitespace note (1–2000 characters), otherwise `400 RESOLUTION_NOTE_REQUIRED`. Completion persists both the note and resolution time.

## Other responses

- `GET /health` (public): `{ "data": { "status": "ok" } }`.
- `401 UNAUTHORIZED`: missing, malformed, or expired bearer token.
- `403 FORBIDDEN`: role is insufficient.
- `404 REQUEST_NOT_FOUND`: no accessible request.
- `400 VALIDATION_ERROR`: invalid body, path ID, or query filter.
