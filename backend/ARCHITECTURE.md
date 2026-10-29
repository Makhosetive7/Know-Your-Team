# Backend architecture

Detailed backend design for Know Your Team. System context is in the [unified architecture](../ARCHITECTURE.md). Package orientation is in the [backend README](README.md).

This describes the intended MVP. Authentication, teams, invitations, daily assignment, completions, and team-level progress are implemented. Email verification and password reset are still deferred.

## Modular monolith

The backend is one FastAPI process with clear module boundaries. Routers, services, and repositories stay separated by domain. Microservices are not part of the first release.

## Layering

```text
HTTP routers (app/api)
    → services (business rules)
        → repositories (persistence)
            → models (SQLAlchemy or SQLModel)
```

- **Schemas** sit at the HTTP edge (Pydantic request and response models).
- **Core** holds settings, security helpers, and timezone helpers.
- Routers authenticate, authorise, and translate HTTP to service calls. They do not embed assignment or completion rules.
- Services own rules: membership, invitation redemption, daily assignment, idempotent completion, team-level progress.
- Repositories isolate queries and writes. Unique constraints in the database remain the last line of defence for duplicates.

## Module map

### Authentication and users

Register, log in, and read or update the current user (`GET` / `PATCH /api/v1/users/me`). Sessions or tokens come from an established auth implementation.

### Teams and memberships

Create a team, list teams for the current user, get a team, list members, leave a team, and remove a member when authorised. A team includes a timezone. Membership carries a role and status.

### Invitations

Team administrators create invitation links or codes. Users join through `POST /api/v1/teams/join`. Invitations support expiry, revocation, and rate limits.

### Activity library

Curated templates: title, instructions, category, estimated duration. The MVP does not generate activities with AI.

### Daily assignment

Timezone-aware get-or-create of a `DailyActivity` for `(team, date)`. Every member of the team receives the same assignment for that local date.

### Completions

Idempotent complete and skip against the current assignment. The record stores user, assignment, and timestamp. Repeating the action must not create a second row.

### Progress

Team-level only: member count, how many completed today's activity, participation percentage, recent activities, and trends. Individual participation is not a manager performance report.

### Administrative operations

Platform administrators manage the activity library and resolve operational issues. This role does not grant access to private responses.

## Entity rules

- **DailyActivity:** unique on `(team, date)`.
- **ActivityCompletion:** unique per user per assignment so complete cannot duplicate.
- **TeamMembership:** one active membership per user per team; role is member or team administrator; status distinguishes active membership from left or removed.
- **Invitation:** opaque token or code, expiry, revocation flag, and rate limits on creation and redemption.
- **Activity:** reusable template; assignments point at a template rather than copying instructions ad hoc, unless a snapshot is later required.

Optional reflections, if added later, are a separate entity with separate access control. A completion row is not a response body.

## Assignment algorithm

1. Determine the team's configured timezone.
2. Work out the current local date for that team.
3. Select one eligible activity (simple rotation or a curated schedule; avoid recent repeats when the library allows).
4. Create or retrieve the assignment for that team and date.
5. Return the same activity to all members.
6. Record completions against that assignment.
7. Prevent duplicate assignments and duplicate completions.

Concurrent first-of-day requests must not create two assignments. The unique constraint on `(team, date)` plus get-or-create in the service handles that race.

## Authorisation matrix

| Endpoint family | Member | Team administrator | Platform administrator |
|-----------------|--------|--------------------|------------------------|
| Auth and `/users/me` | Own account | Own account | Own account; operational tools as needed |
| List/get own teams, members, daily activity, history | Yes, for teams they belong to | Yes, for teams they belong to | Operational only |
| Complete or skip daily activity | Yes | Yes, as a member of the team | No, unless also a member |
| Team progress (team-level summaries) | Yes | Yes | Operational only |
| Create team | Yes | Yes | — |
| Create invitations, remove members, workspace settings | No | Yes | Operational only |
| Manage activity library | No | No | Yes |
| Private responses or reflections | Never via team-admin dashboards | Never | Never as a surveillance path |

Unauthenticated callers may only hit registration, login, and any documented public join-token validation that does not leak team internals. Cross-team access returns the same not-found behaviour as a missing resource.

## Idempotency and concurrency

- **Complete:** pressing complete repeatedly returns the existing completion; it does not insert again.
- **Skip:** same uniqueness rule against the assignment so skip cannot duplicate and cannot both complete and skip without an explicit product rule (MVP: one outcome per user per assignment).
- **Assignment:** two members requesting today's activity at once share one `DailyActivity` row.

## Privacy in the data model

Completion records whether the person took part, not what they said. Administrator dashboards must not join completions to private text. If optional reflections exist later, they need their own permissions and must not be implied by complete.

Progress endpoints aggregate. They do not rank individuals by default.

## Error and validation policy

- Pydantic validates all request bodies and query parameters at the boundary.
- **401** when the caller is not authenticated.
- **403** when the caller is authenticated but lacks the role or membership.
- **404** for unknown teams, assignments, or members in a way that does not leak other teams' resources.
- **409** or equivalent when a unique constraint is the user-visible conflict (for example an invitation already used), without exposing internals.
- Rate limits on auth and invitation endpoints.

## Target tests

- Registration, login, and `/users/me` access control
- Permission boundaries across teams and roles
- Daily assignment across timezones (same team date for all members; different teams may differ)
- Get-or-create under concurrent first assignment
- Duplicate complete and skip handling
- Invitation expiry, revocation, and rate limits
- Progress counts matching recorded completions
- Administrator endpoints never returning private response payloads
