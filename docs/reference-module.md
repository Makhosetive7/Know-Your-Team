# Reference module

Imitate the real folders. Language rules stay in [coding-standards-frontend.md](coding-standards-frontend.md) and [coding-standards-backend.md](coding-standards-backend.md).

| Layer         | Imitate this                                                           | Why                                                                  |
| ------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Frontend      | `frontend/src/features/activities/`                                    | Daily activity is the product: complete, skip, history, empty states |
| Frontend HTTP | `frontend/src/services/`                                               | Only place that calls `/api/v1`                                      |
| Frontend auth | `frontend/src/features/auth/`                                          | Register, sign in, JWT session                                       |
| Backend rules | `backend/app/services/daily_activity.py` and `backend/app/services/` | Timezone, get-or-create, idempotent complete/skip                    |
| Backend HTTP  | Routers under `backend/app/api/`                                       | Authn/authz then service call; no embedded assignment logic          |
| Tests         | `backend/tests/` plus frontend unit/e2e for the activity journey       | Permission, timezone, duplicate complete                             |
