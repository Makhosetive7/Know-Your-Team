# Backend

The Know Your Team API is the source of truth for users, teams, daily activity assignment, completions, and team-level progress.

This package is documentation-only until application code exists. See [backend architecture](ARCHITECTURE.md) for module design, the [unified architecture](../ARCHITECTURE.md) for system context, and [backend coding standards](../docs/coding-standards-backend.md) for functions, types, and declarations.

## Intended stack

- Python 3.11+, FastAPI, REST
- Pydantic for request and response validation
- PostgreSQL
- SQLAlchemy or SQLModel
- Alembic migrations
- Pytest

Authentication should use an established implementation (email and password or passwordless), not a custom protocol.

## Intended layout

```text
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   └── main.py
├── migrations/
├── tests/
└── pyproject.toml
```

This tree is the target for implementation. It is not present yet.

## Responsibilities

- Authentication and users
- Teams and memberships
- Invitations (create, redeem, expire, revoke)
- Curated activity library
- Timezone-aware daily assignment
- Idempotent completion and skip
- Team-level progress and history
- Operational administration of the activity library

## How the frontend consumes this API

The web app talks to the backend over REST JSON under `/api/v1`. Proposed endpoints are listed in the [unified architecture](../ARCHITECTURE.md). The backend enforces membership, roles, validation, and rate limits; the client must not be trusted to apply those rules.

## Setup, run, and test

To be filled when the application exists. No commands are documented yet.

## Environment variables

A future checklist, names only. No secrets belong in the repository.

- `DATABASE_URL`
- Auth secrets for the chosen established auth implementation
- CORS origin for the frontend
- Other runtime settings as needed (for example log level)

## Non-goals

- Custom authentication protocols
- HR analytics, productivity scoring, or individual participation rankings
- Publishing private answers or reflections through administrator dashboards
- Direct messaging, chat, or video
- Billing and enterprise SSO in the MVP
