# Backend

The Know Your Team API is the source of truth for users, teams, daily activity assignment, completions, and team-level progress.

See [backend architecture](ARCHITECTURE.md) for module design, the [unified architecture](../ARCHITECTURE.md) for system context, and [backend coding standards](../docs/coding-standards-backend.md) for functions, types, and declarations.

## Stack

- Python 3.11+, FastAPI, REST
- Pydantic for request and response validation
- PostgreSQL
- SQLAlchemy 2.0 (async)
- Alembic migrations
- FastAPI Users (email and password, JWT)
- Pytest

## Layout

```text
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── repositories/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── migrations/
├── tests/
└── pyproject.toml
```

## Setup

1. Install Python 3.11+.
2. From the repository root, start PostgreSQL:

   ```bash
   docker compose up -d db
   ```

3. From `backend/`, install dependencies. Prefer `uv` (uses `uv.lock`):

   ```bash
   uv sync --extra dev
   source .venv/bin/activate
   cp .env.example .env
   ```

   Or with pip:

   ```bash
   python3.11 -m venv .venv
   source .venv/bin/activate
   pip install -e ".[dev]"
   cp .env.example .env
   ```

4. Edit `.env` so `SECRET_KEY` is a long random string. Do not commit `.env`.
5. Run migrations:

   ```bash
   alembic upgrade head
   ```

6. Start the API:

   ```bash
   uvicorn app.main:app --reload
   ```

The OpenAPI UI is at `http://127.0.0.1:8000/docs`.

## Environment variables

Names only. No secrets belong in the repository. Copy `.env.example` to `.env`.

- `DATABASE_URL` — async SQLAlchemy URL (`postgresql+asyncpg://…`)
- `SECRET_KEY` — FastAPI Users JWT signing secret
- `CORS_ORIGINS` — comma-separated browser origins (Vite default `http://localhost:5173`)
- `LOG_LEVEL` — Python log level
- `AUTH_RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_WINDOW_SECONDS` — login and register limits
- `INVITATION_CREATE_RATE_LIMIT_MAX` / `INVITATION_CREATE_RATE_LIMIT_WINDOW_SECONDS`
- `INVITATION_JOIN_RATE_LIMIT_MAX` / `INVITATION_JOIN_RATE_LIMIT_WINDOW_SECONDS`

## Auth

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/v1/auth/register` | JSON `{ "email", "password", "display_name"? }` |
| `POST` | `/api/v1/auth/login` | Form fields `username` (email) and `password`; returns `{ "access_token", "token_type" }` |
| `POST` | `/api/v1/auth/logout` | JWT has no server-side session; clients discard the token |
| `GET` / `PATCH` | `/api/v1/users/me` | Bearer token required. `PATCH` accepts `{ "display_name" }` |

Passwords must be at least 8 characters. Email verification is not wired yet; new accounts are marked verified so login works locally.

## Teams

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/v1/teams` | JSON `{ "name", "timezone" }`. Creator becomes team administrator. Timezone is an IANA name such as `Europe/Amsterdam`. |
| `GET` | `/api/v1/teams` | Teams the caller currently belongs to |
| `GET` | `/api/v1/teams/{team_id}` | `404` if the caller is not an active member |
| `PATCH` | `/api/v1/teams/{team_id}` | Team administrator. `{ "name"?, "timezone"? }` |
| `GET` | `/api/v1/teams/{team_id}/members` | Active members |
| `DELETE` | `/api/v1/teams/{team_id}/members/{user_id}` | Leave (own id) or remove (team administrator). The last administrator cannot leave or be removed. |

Unknown teams and teams the caller cannot see both return `404` `team_not_found`.

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/v1/teams/{team_id}/invitations` | Team administrator. Optional `{ "expires_in_days" }` (1–30, default 7). Returns the raw token once. |
| `GET` | `/api/v1/teams/{team_id}/invitations` | Team administrator. Does not include tokens. |
| `POST` | `/api/v1/teams/{team_id}/invitations/{invitation_id}/revoke` | Team administrator |
| `GET` | `/api/v1/teams/join?token=` | Public preview. Returns `{ "team_name" }` or `404` `invitation_invalid`. |
| `POST` | `/api/v1/teams/join` | Authenticated. JSON `{ "token" }`. Joiners become members. |

Invalid, expired, and revoked invitations all return `404` `invitation_invalid`.

## Daily activity

Dates use the **team timezone**. Completing twice is idempotent. Skip and complete cannot both be recorded for the same assignment.

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/v1/teams/{team_id}/daily-activity` | Get-or-create today's assignment |
| `GET` | `/api/v1/teams/{team_id}/activities/history` | Recent assignments and the caller's completion |
| `POST` | `/api/v1/teams/{team_id}/daily-activity/complete` | |
| `POST` | `/api/v1/teams/{team_id}/daily-activity/skip` | |
| `GET` | `/api/v1/teams/{team_id}/progress` | Team-level counts only |
| `GET` | `/api/v1/teams/{team_id}/progress/history` | |

Progress reports member count, completed count, skipped count, and participation percent (`completed / members`). It does not rank individuals.

## Admin

Platform administrators are users with `is_superuser` set in the database. This is an operational flag, not a product role.

| Method | Path | Notes |
|--------|------|-------|
| `GET` / `POST` | `/api/v1/admin/activities` | Superuser only. The library is also seeded by migration `0004`. |

## Demo seed

Local accounts for trying an invite link and team participation. Run migrations first. Set `DEMO_SEED_PASSWORD` in the environment to at least 8 characters. The value is not stored in the repository and is not printed.

```bash
DEMO_SEED_PASSWORD='your-local-password' python -m app.core.demo_seed
```

| Email | What you can try |
|-------|------------------|
| `platform@example.com` | Activity library at `/admin/activities` |
| `ada@example.com` | Team administrator of Studio. Today's activity is still open. |
| `grace@example.com` | Member of Studio who has already completed today. |
| `nia@example.com` | Registered, not on the team. Open the printed invite path, sign in, and join. |

Each run keeps those accounts and Studio, leaves Grace's completion as one record, and prints a new invite path such as `/join?token=…`. Open it on the frontend origin (`http://localhost:5173` by default). Studio starts at 1 of 2 completed. Do not run this against production.

## Checks

From `backend/` with the virtualenv active:

```bash
ruff check .
ruff format --check .
mypy .
pytest
```

Tests use in-memory SQLite and do not need Docker.

## Non-goals

- Custom authentication protocols
- HR analytics, productivity scoring, or individual participation rankings
- Publishing private answers or reflections through administrator dashboards
- Direct messaging, chat, or video
- Billing and enterprise SSO in the MVP
