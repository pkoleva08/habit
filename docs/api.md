# Habitly API

## Base URL

- Direct server: http://localhost:4000/api

## Authentication

### Register

- Method: POST
- Path: /auth/register
- Body:

```json
{
	"name": "User Name",
	"email": "user@example.com",
	"password": "Pass1234!"
}
```

### Login

- Method: POST
- Path: /auth/login
- Body:

```json
{
	"email": "user@example.com",
	"password": "Pass1234!"
}
```

- Response returns JWT token and user profile.
- The client stores token in localStorage under key habitly_token.

## Habits

### Create habit

- Method: POST
- Path: /habits
- Requires Authorization header: Bearer <token>
- Body:

```json
{
	"name": "Project obligation task",
	"frequency": "daily",
	"reminderTime": "20:30"
}
```

- Response contains:
	- habit: created habit data
	- notification: created notification row

Example notification message:
- Reminder configured for "Project obligation task" at 20:30:00

### Complete habit

- Method: POST
- Path: /habits/:id/complete
- Creates completion record and may generate badge notifications on milestones.

## Notifications

### List notifications

- Method: GET
- Path: /habits/notifications?limit=20
- Requires Authorization header: Bearer <token>
- Returns latest notifications for current user.

### Reminders queue

- Method: GET
- Path: /habits/reminders
- Returns currently due reminders.

## Where notifications are shown in UI

- On habit creation page, a success notice appears immediately after creating a habit.
- In Dashboard page, card "Your notifications" shows saved notifications from database.

## Start the application

Run this single command from the project root. It starts both the API server and the client together:

```bash
npm run dev
```

- Client: http://localhost:5173
- API server: http://localhost:4000

The client calls the API directly, so Vite proxy 502 errors no longer apply.

## Persistent accounts with PostgreSQL

When PostgreSQL is unavailable, the server uses a temporary in-memory database. Accounts created in that mode are deleted when the backend restarts.

Start PostgreSQL with Docker before running the application:

```bash
docker compose up -d database
```

Then run `npm run dev`. The configuration matches [server/.env](../server/.env): database `habitly`, user `postgres`, password `postgres`, and port `5432`.
