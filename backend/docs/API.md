# Maintenance Tracker API

Base URL: `http://localhost:3000/api`. Every response is `{ "data": ... }`; failures are `{ "error": { "code", "message" } }` (validation errors also include `details`). Send `X-Demo-User-Id: <user-id>` on protected routes after selecting a demo user.

## Demo Users

### `GET /auth/users` (public)

Returns seeded demo users for the hardcoded switcher. The frontend uses the selected user's `id` in the `X-Demo-User-Id` header. There are no passwords, sessions, or login endpoints.

## Request Object

`id`, `title`, `description`, `priority` (`LOW`, `NORMAL`, `URGENT`), `status` (`NEW`, `IN_PROGRESS`, `DONE`), `createdAt`, `updatedAt`, `statusChangedAt`, `resolutionNote`, `resolvedAt`, and `isUrgent`. Admin responses also contain `client: { id, name, email }`. Timestamps are UTC ISO-8601 strings. `isUrgent` is true only for an `URGENT` request that has remained `NEW` for more than 24 hours according to `statusChangedAt`.

## Client Endpoints

- `GET /requests` - client only: lists only their own requests.
- `POST /requests` - client only. Body: `{ "title": "Contact form is failing", "description": "Website leads are not arriving in the shared inbox.", "priority": "URGENT" }`. Returns `201`. The API sets owner and `NEW` status; protected fields are rejected. Priority defaults to `NORMAL` when omitted.
- `GET /requests/:id` - demo user required. Clients receive only their own request; another client's ID returns `404`.

## Admin Endpoints

- `GET /admin/requests?status=NEW&clientId=<uuid>` - admin only. Both filters are optional and combine when supplied. Invalid filters return `400`.
- `GET /admin/requests/:id` - admin only.
- `PATCH /requests/:id/status` - admin only. Body: `{ "status": "IN_PROGRESS" }` or `{ "status": "DONE", "resolutionNote": "Replaced the faulty valve." }`.

Only `NEW -> IN_PROGRESS -> DONE` is allowed. Invalid transitions return `409 INVALID_STATUS_TRANSITION`. `DONE` requires a non-whitespace note (1-2000 characters), otherwise `400 RESOLUTION_NOTE_REQUIRED`. Completion persists both the note and resolution time.

## Other Responses

- `GET /health` (public): `{ "data": { "status": "ok" } }`.
- `401 DEMO_USER_REQUIRED` or `DEMO_USER_NOT_FOUND`: missing or unknown demo user header.
- `403 FORBIDDEN`: role is insufficient.
- `404 REQUEST_NOT_FOUND`: no accessible request.
- `400 VALIDATION_ERROR`: invalid body, path ID, or query filter.
