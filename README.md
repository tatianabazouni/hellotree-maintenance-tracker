# Hellotree Maintenance Tracker

Small website and app maintenance request tracker for Hellotree clients and admins. The backend is a TypeScript/Express API with Prisma and PostgreSQL. The frontend is a Vite React app with a hardcoded demo user switch.

## Run The Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

The API runs on `http://localhost:3000`.

## Run The Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## Demo Users

Use the switcher in the frontend. Seeded users are:

- Admin: `admin@example.com`
- Clients: `cedar@example.com`, `bluewave@example.com`, `nova@example.com`

The frontend uses `/api/auth/users` and sends the selected user's ID in `X-Demo-User-Id`. There is no login, password, JWT, or session flow.

## Business Rules

- Clients can create requests with `title`, `description`, and `priority`.
- Clients only see their own requests.
- Admins see all client requests and can filter by status and client.
- The API only allows `NEW -> IN_PROGRESS -> DONE`.
- The API rejects `DONE` without a non-empty resolution note.
- The admin list flags only urgent requests that are still `NEW` more than 24 hours after their `statusChangedAt` timestamp.

## Verification

Backend checks:

```bash
cd backend
npm test
npm run build
```

Frontend check:

```bash
cd frontend
npm run build
```

## What Was Cut

Real authentication, notifications, file attachments, comments, and deep design polish were intentionally left out. The assignment allowed fake auth, and the core tracking workflow plus API-enforced business rules are the important parts.
