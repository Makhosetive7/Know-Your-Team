# Frontend architecture

Detailed frontend design for Know Your Team. System context is in the [unified architecture](../ARCHITECTURE.md). Package orientation is in the [frontend README](README.md).

This describes the intended MVP. Application code is not in the repository yet.

## Feature-sliced UI

Screens compose feature modules. Shared components stay generic: layout, buttons, empty states, and error states.

| Area | Responsibility |
|------|----------------|
| `src/pages` | Route-level screens that compose features |
| `src/features/auth` | Register, sign in, session-aware UI |
| `src/features/teams` | Create, join, members, workspace settings |
| `src/features/activities` | Today's activity, complete, skip, history |
| `src/features/progress` | Team-level participation overview |
| `src/components` | Shared presentational pieces |
| `src/services` | HTTP calls to `/api/v1` |
| `src/hooks` | Reusable client hooks over services |
| `src/types` | Shared JSDoc `@typedef`s aligned with API JSON |

## Routing intent

Exact paths are deferred until implementation. The shape is:

- **Public:** register, sign in, join-with-token landing if needed
- **Authenticated app shell:** navigation for the current user's teams
- **Team-scoped:** today's activity, progress, activity history
- **Team admin:** members, invitations, basic workspace settings
- **Account:** basic profile

Unknown or forbidden team routes follow the same empty or not-found treatment as the API's 404 behaviour and must not leak other teams' names or data.

## Data flow

```text
Page or feature
    → hook
        → src/services
            → REST JSON /api/v1
```

- Shared resource shapes live in `src/types` as JSDoc `@typedef`s.
- Pages and hooks may call `src/services`. Presentational components in `src/components` (and feature UI that is only presentational) must not import `src/services` or `fetch`.
- The client does not decide which activity is featured, whether a completion is unique, or whether the user may invite members.
- Optimistic UI is optional later; the MVP can wait for the server response.

## Auth session

Store session credentials according to the chosen established auth approach. Do not invent a client-side auth protocol. Unauthenticated users are sent to sign in. Expired or invalid sessions clear local session state and return to public routes.

## Daily activity UX contract

The activity page shows:

- Title
- Short description
- Instructions
- Estimated time
- Category
- Complete control
- Skip or alternative where the API permits it

Every member of a team sees the same activity because the API is the source of truth. Completing is a single idempotent action; the UI may disable or confirm after success, but it must tolerate a repeat submit without treating it as a new event.

Paired activities may optionally confirm that the interaction happened. The conversation itself is not published.

## Progress UX contract

The dashboard shows team-level information: member count, how many completed today's activity, participation percentage, recent activities, and trends. It does not present a default leaderboard of individuals and does not expose private answers.

## State

- **Server state:** current user, memberships, today's activity, completions, progress, history.
- **Local UI state:** form fields, transient errors, simple open/closed controls.

Keep state management simple. Do not introduce Redux or equivalent unless later complexity requires it.

## Responsive behaviour

One web app for desktop, tablet, and mobile browsers. Layout should remain usable without a native app. Primary actions (complete, skip, join, create team) must be reachable on a small viewport.

## Error and empty states

| State | Intent |
|-------|--------|
| Unauthenticated | Sign in or register |
| Authenticated but not a member of any team | Create or join a team |
| Not a member of the requested team | Not found or no access, without leaking the team |
| No activity assigned yet | Calm empty state; retry or wait for assignment |
| Already completed | Confirm completion; do not invite a second complete as a new record |
| Skipped | Acknowledge skip without penalty language |
| Network or server failure | Recoverable error, no lost private text implied |

## Target tests

- Unit tests for view logic (formatting participation, disabled complete after success, skip affordance)
- Browser end-to-end for the critical journey: register → create or join a team → see today's activity → complete → see team progress
- Coverage of skip, unauthenticated access to team routes, and basic mobile viewport for the activity page
