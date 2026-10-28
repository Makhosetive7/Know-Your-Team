# Backend coding standards

Language-level rules for `backend/`. Architecture and boundaries stay in [backend/ARCHITECTURE.md](../backend/ARCHITECTURE.md). Project-wide rules stay in [AGENTS.md](../AGENTS.md). If this file disagrees with AGENTS.md, AGENTS.md wins.

Stack: Python 3.11+, FastAPI, Pydantic, SQLAlchemy or SQLModel, strict mypy. Public functions always have types.

---

## Declarations

Module-level constants are `UPPER_SNAKE_CASE`. Functions, methods, and variables are `snake_case`. Classes are `PascalCase`. Modules are `snake_case.py`.

```python
MAX_TEAM_NAME_LENGTH = 80
DEFAULT_ACTIVITY_MINUTES = 3
```

Never use mutable default arguments. Use `None` and assign inside.

```python
# BAD
def collect_ids(found: list[uuid.UUID] = []) -> list[uuid.UUID]:
    found.append(uuid.uuid4())
    return found

# GOOD
def collect_ids(found: list[uuid.UUID] | None = None) -> list[uuid.UUID]:
    items = found if found is not None else []
    items.append(uuid.uuid4())
    return items
```

Prefer module-level functions in services and repositories. Use classes when there is real identity or injected collaborators (a service that holds a session/repository), Pydantic/ORM models, or exception types. Do not create a class that only wraps one function.

```python
# BAD
class CompletionHelper:
    def complete(self, user_id: uuid.UUID) -> None:
        ...

# GOOD
class CompletionService:
    def __init__(self, completions: CompletionRepository) -> None:
        self._completions = completions

    def complete(self, *, user_id: uuid.UUID, assignment_id: uuid.UUID) -> ActivityCompletion:
        ...
```

Private helpers start with `_`. Do not use a leading double underscore unless you are opting into name mangling on a class (almost never).

Annotate instance attributes on `__init__` (or via dataclasses / Pydantic). Do not create ad-hoc attributes later (`self.foo = ...` in a random method) unless the type is declared on the class.

---

## Functions

Every public function and method has parameter types and a return type. Use `-> None` when it returns nothing.

```python
def participation_percent(*, completed_count: int, member_count: int) -> int:
    if member_count == 0:
        return 0
    return round((completed_count / member_count) * 100)
```

Rules:

- Prefer keyword-only arguments (`*`) once a function takes two or more parameters of the same type, or any id-like value. Call sites must say `user_id=` / `team_id=` so they cannot be swapped.
- Early return. Do not nest five levels of `if`.
- Do not use a `bool` flag to hide two operations. Split `complete_daily_activity` and `skip_daily_activity`.
- `async def` only for I/O (database, HTTP). CPU-only helpers stay sync and are called from async services without `await`.
- Routers are thin: parse auth, call a service, return a schema. No assignment or completion rules in routers.
- Services raise domain errors. They do not return `None` to mean "not allowed".
- Repositories do not make authorisation decisions.

```python
# BAD
async def complete(user_id: uuid.UUID, team_id: uuid.UUID, skip: bool) -> ActivityCompletion | None:
    if skip:
        ...
    return None

# GOOD
async def complete_daily_activity(
    self,
    *,
    user_id: uuid.UUID,
    team_id: uuid.UUID,
) -> ActivityCompletion:
    assignment = await self._assignments.get_or_create_today(team_id=team_id)
    return await self._completions.complete(user_id=user_id, assignment_id=assignment.id)
```

Idempotent writes: get-or-create (or catch unique violations and re-read). Do not `insert` and hope.

Do not swallow exceptions. Unique-constraint races use SQLAlchemy's `IntegrityError` (`from sqlalchemy.exc import IntegrityError`), not a builtin.

```python
from sqlalchemy.exc import IntegrityError

# BAD
try:
    return await self._completions.complete(...)
except Exception:
    return None

# GOOD
try:
    return await self._completions.complete(...)
except IntegrityError:
    existing = await self._completions.get(user_id=user_id, assignment_id=assignment.id)
    if existing is None:
        raise
    return existing
```

---

## Types

Use built-in generics and unions. From `typing`, import only what has no builtin equivalent (`Annotated`, `Protocol`, `Literal`, `ClassVar`). Do not import `List`, `Dict`, `Optional`, `Union` for new code.

```python
# BAD
from typing import Dict, List, Optional

def members(team_id: Optional[uuid.UUID]) -> List[Dict[str, str]]:
    ...

# GOOD
from typing import Annotated

def list_members(*, team_id: uuid.UUID | None) -> list[dict[str, str]]:
    ...
```

Prefer `X | None` over `Optional[X]`. Prefer `list[T]`, `dict[K, V]`, `set[T]`, `tuple[T, ...]`. FastAPI dependencies use `Annotated[T, Depends(...)]` with `from typing import Annotated`.

### What type belongs where

| Kind                        | Use                                                   |
| --------------------------- | ----------------------------------------------------- |
| HTTP request/response       | Pydantic `BaseModel` in `app/schemas`                 |
| Persistence                 | SQLAlchemy or SQLModel in `app/models`                |
| Domain errors               | Custom exception classes in `app/core`                |
| Internal value objects      | Pydantic model or frozen dataclass                    |
| Roles, statuses, categories | `enum.StrEnum`                                        |
| IDs                         | `uuid.UUID`                                           |
| Calendar day for a team     | `datetime.date`                                       |
| Timestamps                  | timezone-aware `datetime.datetime` (`UTC` in storage) |

Do not pass raw `dict[str, Any]` through services. Do not use `Any` except at a documented boundary (for example a third-party library with no stubs), and isolate it.

```python
from datetime import date, datetime, timezone
from enum import StrEnum
import uuid

from pydantic import BaseModel, ConfigDict, Field


class MembershipRole(StrEnum):
    MEMBER = "member"
    TEAM_ADMINISTRATOR = "team_administrator"


class DailyActivityStatus(StrEnum):
    AVAILABLE = "available"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str = Field(min_length=1, max_length=MAX_TEAM_NAME_LENGTH)
    timezone: str
```

ORM models and Pydantic schemas are different types. Services accept/return domain or schema types as decided per module; they do not return untyped rows to routers.

### Null vs missing

- `T | None` means the value exists and may be empty (nullable column, optional profile field).
- Omit a Pydantic field or use `Field(default=...)` for "caller did not send this" on PATCH.
- For PATCH, use a sentinel or `model_fields_set` so `null` (clear the field) is distinct from "not in the body". Do not treat missing and `null` as the same unless the endpoint documents that.

### Literal and enum

Use `StrEnum` for values stored or sent on the wire (roles, completion outcome). Use `typing.Literal` only for a tiny closed set that will not be reused (for example a single query flag). Do not use `Literal["member", "team_administrator"]` in five files; that is an enum.

Persist the **value** (`"member"`), never the member name (`"MEMBER"`). FastAPI and Pydantic serialize `StrEnum` as that string. SQLAlchemy and some query builders do not always coerce a `StrEnum` the same way, so map columns explicitly:

```python
from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

# GOOD — store the StrEnum value, not the member name
role: Mapped[MembershipRole] = mapped_column(
    Enum(MembershipRole, values_callable=lambda members: [item.value for item in members]),
)

# ALSO GOOD — plain string column if you convert at the schema boundary
timezone: Mapped[str] = mapped_column(String)
```

If you pass a role into raw SQL or a third-party query builder and the driver does not accept the enum, pass `role.value`. Do not sprinkle `.value` through FastAPI or Pydantic code that already understands `StrEnum`.

### Protocols

If two repositories share a contract the service depends on, use `typing.Protocol`. Do not invent a deep ABC hierarchy for the MVP.

```python
from typing import Protocol


class AssignmentRepository(Protocol):
    async def get_or_create_today(self, *, team_id: uuid.UUID) -> DailyActivity:
        ...
```

### Generics

Use generics on repositories only when it removes duplication you already have. A `Repository[Team]` abstraction is not required for the MVP. Prefer explicit methods (`get_by_id`, `list_for_user`).

---

## FastAPI and Pydantic specifics

- Type path/query/body with Pydantic and built-in types. Do not parse JSON by hand in a router.
- Dependency injection via `Depends` for current user and services. Do not import a global session inside a route body if a dependency exists.
- Response model declared on the route (`response_model=TeamRead`) or annotated return type, consistently.
- Error payload is `{ "error": { "code": str, "message": str } }`, not a success envelope.

```python
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends

router = APIRouter()


@router.post("/{team_id}/daily-activity/complete", response_model=CompletionRead)
async def complete_daily_activity(
    team_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    completions: Annotated[CompletionService, Depends(get_completion_service)],
) -> CompletionRead:
    completion = await completions.complete_daily_activity(
        user_id=current_user.id,
        team_id=team_id,
    )
    return CompletionRead.model_validate(completion)
```

---

## Modules and files

| Kind       | Location            | Typical exports                 |
| ---------- | ------------------- | ------------------------------- |
| Router     | `app/api/`          | `APIRouter`, endpoint functions |
| Schema     | `app/schemas/`      | Pydantic models                 |
| Service    | `app/services/`     | class with typed methods        |
| Repository | `app/repositories/` | class or module functions       |
| Model      | `app/models/`       | ORM mapped classes              |
| Tests      | `backend/tests/`    | `test_*` functions              |

Imports: stdlib, third party, local. Ruff `I` will sort them. Do not import `frontend/`.

Allowed from `typing`: `Annotated`, `Protocol`, `Literal`, `ClassVar`. Not allowed in new code: `Optional`, `List`, `Dict`, `Union`, `Any` (except an isolated third-party boundary).

---

## Do not

- Untyped public functions, `Any` through domain code, `Optional`/`List`/`Dict` in new code
- Mutable defaults, bare `except:`, returning `None` for permission failures
- Catching a unique-constraint race with anything other than `sqlalchemy.exc.IntegrityError` (not sqlite3, not a bare `Exception`)
- Business rules in routers or authorisation in repositories
- Naive `datetime.now()` for "today" — use the team's timezone
- Logging invitation tokens, passwords, or private reflection text
- Individual ranking queries on progress endpoints
