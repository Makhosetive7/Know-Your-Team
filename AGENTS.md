# AGENTS.md

Single source of truth for humans and AI tools working in this repository. Other instruction files point here. Do not duplicate rules elsewhere in a way that can drift.

Read this file and [CONTRIBUTING.md](CONTRIBUTING.md) before changing anything. Architecture lives in [ARCHITECTURE.md](ARCHITECTURE.md), [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md), and [frontend/ARCHITECTURE.md](frontend/ARCHITECTURE.md). How to declare functions and types: [frontend](docs/coding-standards-frontend.md) and [backend](docs/coding-standards-backend.md). Team process lives in [docs/coding-standards-playbook.md](docs/coding-standards-playbook.md).

## Project overview

Know Your Team is a lightweight team-building web app: one featured activity per team per day so coworkers can connect without extra meetings. The MVP is a modular monolith. A React + JavaScript + Vite frontend talks to a Python FastAPI REST API. PostgreSQL is the system of record. The repository is still pre-MVP: documentation first, then application code.

## Stack

- Frontend: React, JavaScript (ES modules + JSX), Vite, responsive CSS or a component library
- Backend: Python 3.11+, FastAPI, REST, Pydantic
- Database: PostgreSQL, SQLAlchemy or SQLModel, Alembic
- Auth: an established implementation, not a custom protocol
- Tests: Pytest, frontend unit tests, API integration tests, browser end-to-end tests for critical journeys
- Infra (intended): GitHub Actions, managed PostgreSQL, config in environment variables

There is no Node/Express backend, no MongoDB, no microservices, and no native apps in the MVP.

## Commands

Application scripts are not in the repository yet. When they exist, use these from the package directories. Do not invent a root `npm run dev` that runs both apps unless we add it.

**Frontend** (`frontend/`):

- Install: `npm ci`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Format: `npm run format`
- Test: `npm test`
- All: `npm run check`

**Backend** (`backend/`):

- Lint: `ruff check .`
- Format: `ruff format .`
- Types: `mypy .`
- Test: `pytest`

Until those scripts exist, do not add fake commands, extra package managers, or new dependencies to "make checks work".

## Rules you MUST follow

1. Read this file, CONTRIBUTING.md, the language standard for the package you are changing, and the relevant architecture doc.
2. Reuse existing utilities, components, services, and schemas. Search the codebase before writing a new helper.
3. Do not add new dependencies without asking. If you propose one, justify it and verify the package exists and is maintained.
4. Make small, scoped changes. Do not refactor unrelated code.
5. Every behaviour change needs a test. Bug fixes start with a failing test that reproduces the bug.
6. Do not add TypeScript. Frontend is JavaScript. Document public shapes with JSDoc `@typedef` / `@param`.
7. Never swallow errors. Follow the error-handling pattern below.
8. Never commit secrets. Use environment variables. Never put credentials in docs, fixtures, or client code.
9. Run lint and tests for the packages you touched before declaring work done. When scripts exist, that means `npm run check` in `frontend/` and `ruff` / `mypy` / `pytest` in `backend/`.
10. Do not weaken lint, type, or test rules to get a green build. Fix the code.
11. Privacy: this product is for connection, not monitoring. Do not add individual participation rankings, manager surveillance of private answers, or HR/performance scoring.
12. Completing an activity is not consent to share a response. Model optional reflections separately from `ActivityCompletion`.

## Conventions

Detail with examples: [frontend coding standards](docs/coding-standards-frontend.md) and [backend coding standards](docs/coding-standards-backend.md). Summary:

- JavaScript files: `kebab-case.js` (hooks too: `use-daily-activity.js`); React components: `PascalCase.jsx` matching the export
- JavaScript: `const` over `let`, never `var`; `function` for components/hooks/public helpers; arrows for callbacks; named exports only; JSDoc on public functions; frozen constant maps for roles/statuses; `null` from the API, omitted keys for optional props
- Python modules: `snake_case.py`; functions/variables: `snake_case`; classes: `PascalCase`; constants: `UPPER_SNAKE_CASE`
- Python: typed public functions; `list[T]` / `X | None` not `List` / `Optional`; keyword-only ids (`user_id=`); Pydantic schemas, `StrEnum` for wire values, `uuid.UUID` for ids; no mutable defaults
- Imports ordered: external, internal absolute, relative
- API paths stay under `/api/v1`
- Dates for daily assignment use the **team timezone**, not the caller's browser timezone

## Folder structure

Target layout (create these when writing application code, not empty placeholders):

```text
know-your-team/
├── frontend/src/{components,features/{auth,teams,activities,progress},pages,services,hooks,types}
├── backend/app/{api,core,models,schemas,services,repositories,main.py}
├── backend/{migrations,tests}
└── docs/
```

## API response shape

Use HTTP status codes and resource JSON. Do **not** wrap every success in `{ "success": true, "data": ... }`.

- Success: `200` / `201` with a Pydantic resource or list payload.
- Empty success (for example some deletes): `204` with no body.
- Client and auth errors: `401`, `403`, `404`, `409`, `422` as in [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md).
- Error body:

```json
{
  "error": {
    "code": "team_not_found",
    "message": "Team not found."
  }
}
```

`404` for a team the caller cannot see must not leak that another team exists. Validation errors from Pydantic stay at the HTTP boundary.

## Error handling pattern

**Backend**

- Routers do not catch-and-ignore. Translate domain errors to HTTP in one place (exception handlers or a thin router mapping).
- Services raise explicit domain errors (`NotFoundError`, `PermissionDeniedError`, `ConflictError`). Do not return `None` to mean "not allowed".
- Completions and daily assignment are idempotent. Unique constraints in PostgreSQL are the last line of defence; services still get-or-create rather than insert blindly. Unique-constraint races catch `sqlalchemy.exc.IntegrityError` and re-read; they do not swallow a bare `Exception`.
- Log failures with context (team id, user id, error code). Do not log invitation tokens, passwords, or private reflection text.

**Frontend**

- `src/services` is the only HTTP boundary. Pages and hooks do not call `fetch` directly.
- Map HTTP errors to user-visible states (unauthenticated, no access, already completed, network failure). Do not `console.log` in committed code except `console.warn` / `console.error` when no logger exists yet.
- Do not invent client-side assignment, uniqueness, or authorisation rules.

## Architecture boundaries

- Frontend features do not import backend code. Backend modules do not import frontend code.
- Routers → services → repositories → models. Routers do not embed assignment or completion rules. Repositories do not encode role policy.
- `frontend/src/services` may talk to `/api/v1`. UI components do not.
- Team progress is aggregated. Do not add default individual leaderboards.
- Do not add chat, video, SSO, billing, AI-generated activities, or native apps in the MVP.

## Reference implementation

When application code exists, imitate:

- Frontend: `frontend/src/features/activities/`
- Backend: daily assignment and completion in `backend/app/services/` plus matching tests in `backend/tests/`

Until those folders exist, follow [docs/reference-module.md](docs/reference-module.md).

## Do not

- Do not edit generated files, lockfiles by hand, or migrations already merged.
- Do not disable lint rules inline without a comment explaining why.
- Do not leave commented-out code, TODOs without an issue or ticket link, or stray `console.log` / `print` debugging.
- Do not add Express, MongoDB, Redux, TypeScript, microservices, or extra apps because a generic template mentioned them.
- Do not copy the 22-section product brief into new docs. Link it if it is added under `docs/` later.
