# Reference module

Models and people imitate a good example more reliably than abstract rules. This file is the stand-in until application code exists.

When the first features are implemented, this document should shrink to pointers at real folders. Do not keep a second, conflicting style guide here. Language rules stay in [coding-standards-frontend.md](coding-standards-frontend.md) and [coding-standards-backend.md](coding-standards-backend.md).

## Gold-standard features

| Layer         | Imitate this                                                           | Why                                                                  |
| ------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Frontend      | `frontend/src/features/activities/`                                    | Daily activity is the product: complete, skip, history, empty states |
| Frontend HTTP | `frontend/src/services/`                                               | Only place that calls `/api/v1`                                      |
| Backend rules | Daily assignment and completion services under `backend/app/services/` | Timezone, get-or-create, idempotency                                 |
| Backend HTTP  | Routers under `backend/app/api/`                                       | Authn/authz then service call; no embedded assignment logic          |
| Tests         | `backend/tests/` plus frontend unit/e2e for the activity journey       | Permission, timezone, duplicate complete                             |

## What "good" looks like on the frontend

- Page composes `features/activities`; it does not fetch.
- The activity view shows title, description, instructions, estimated time, category, complete, and skip.
- Complete is idempotent in the UI: success disables or confirms; a repeat submit is not treated as a second event.
- Progress UI is team-level. No individual ranking list.
- Empty states: unauthenticated, not a member, no assignment yet, already completed, skipped, network failure.
- Shared shapes live in `src/types` as JSDoc `@typedef`s that match API JSON.

```text
Page
  → feature hook
      → src/services
          → GET/POST /api/v1/teams/{team_id}/daily-activity
```

## What "good" looks like on the backend

```text
router  →  service  →  repository  →  model
schema at the HTTP edge
```

- Assignment: team timezone → local date → get-or-create `DailyActivity` unique on `(team, date)`.
- Completion: unique per user per assignment; repeating complete does not insert again.
- Skip and complete are one outcome per user per assignment.
- Progress aggregates. It does not return private reflection text.
- `404` does not leak other teams.
- Invitation tokens are never logged or returned in progress payloads.

## Tests the reference must include

- Two members of the same team receive the same activity for the same local date.
- Concurrent first fetch of the day creates one assignment, not two.
- Complete twice → one row.
- Member cannot complete for another team.
- Team administrator sees summaries, not private answers.
- Frontend e2e: register → join → complete → team progress updates.

## Do not treat as the reference

- Generic Express, MongoDB, or `{ success, data, error }` envelope examples from other playbooks.
- New helpers that duplicate something already in `src/services` or `app/core`.
- Client code that decides today's activity locally.
