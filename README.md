# Know Your Team

**One small activity. One meaningful connection. Every day.**

Know Your Team is a lightweight team-building web application that helps coworkers get to know each other through one short, optional activity per team per day.

## Status

Planning / pre-MVP. This repository currently holds documentation for the intended product. Application code is not in place yet.

## What this repository contains

- [`frontend/`](frontend/README.md) — responsive web app (planned)
- [`backend/`](backend/README.md) — REST API and domain logic (planned)
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — system-level architecture
- [`AGENTS.md`](AGENTS.md) — coding rules for humans and AI tools
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — branches, commits, PRs, AI policy
- [`docs/coding-standards-playbook.md`](docs/coding-standards-playbook.md) — how those rules get enforced

## Who it is for

Primary users are employees who want simple, low-pressure ways to connect with colleagues. Initial customers are small and medium-sized teams of roughly 5–30 people, in shared workplaces or remote setups. Buyers are typically founders, HR or people teams, and team leaders.

## MVP

A user can register, create or join a team, see the same daily activity as every other member, mark it complete or skip it, and view team-level progress and activity history. The first release validates whether people voluntarily return because the ritual helps them connect.

**Not in the MVP**

- Native Android or iOS apps
- AI-generated activities
- Direct messaging, chat, or video
- Individual performance scoring or HR analytics
- Enterprise SSO
- Billing and subscription management
- Slack or Microsoft Teams integrations

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | React, JavaScript, Vite, responsive CSS or a component library |
| Backend | Python, FastAPI, REST, Pydantic |
| Database | PostgreSQL, SQLAlchemy or SQLModel, Alembic |
| Tests | Pytest, frontend unit tests, API integration tests, browser end-to-end tests for critical journeys |

## Repository map

- [Unified architecture](ARCHITECTURE.md)
- [Backend README](backend/README.md) and [backend architecture](backend/ARCHITECTURE.md)
- [Frontend README](frontend/README.md) and [frontend architecture](frontend/ARCHITECTURE.md)
- [AGENTS.md](AGENTS.md) (rules), [CONTRIBUTING.md](CONTRIBUTING.md), [coding standards playbook](docs/coding-standards-playbook.md)
- [Frontend coding standards](docs/coding-standards-frontend.md) and [backend coding standards](docs/coding-standards-backend.md)
- [Reference module](docs/reference-module.md) (gold-standard behaviour until application code exists)

## Local development

The API and web app are intended to run as separate processes against a PostgreSQL database, with configuration in environment variables and secrets kept out of the repository. Setup, run, and test commands will be added when application code exists.

## Privacy

Know Your Team is for connection, not monitoring. Progress is reported at team level, not as individual rankings. Employees can skip an activity without penalty. Marking an activity complete is not consent to share a personal answer.

## License

TBD
# Know-Your-Team
