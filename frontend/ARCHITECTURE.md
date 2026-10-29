# Frontend architecture

Detailed frontend design for Know Your Team. System context is in the [unified architecture](../ARCHITECTURE.md). Package orientation is in the [frontend README](README.md).

The MVP screens exist: public landing, sign-in, register, join, and an authenticated app shell. A worker who belongs to one team lands on today. Team administrators run the team from an admin home. The activity library is a platform-operator tool.

## Styling

styled-components with a `ThemeProvider` around the app. Color, type, space, radius, and shadow come from `src/styles/theme.js`. The direction is a shared table: linen ground, cream prompt card, clay for the day's action, Fraunces for ritual, Figtree for UI. Global resets live in `src/styles/global-style.js`. Component-specific styled pieces sit **after** the React function in the same file.

There is no component library and no second CSS approach (modules, Tailwind, utility CSS).

## Feature-sliced UI

Screens compose feature modules. Shared components stay generic: layout, buttons, empty states, and error states.

| Area                      | Responsibility                                 |
| ------------------------- | ---------------------------------------------- |
| `src/pages`               | Route-level screens that compose features      |
| `src/features/auth`       | Register, sign in, session-aware UI            |
| `src/features/activities` | Today's activity card: complete, skip, status  |
| `src/features/progress`   | Team-level participation overview              |
| `src/components`          | Shared presentational pieces                   |
| `src/services`            | HTTP calls to `/api/v1`                        |
| `src/types`               | Shared JSDoc `@typedef`s aligned with API JSON |

## Routing

| Path                                          | Access                                      |
| --------------------------------------------- | ------------------------------------------- |
| `/`, `/sign-in`, `/register`, `/join`         | Public                                      |
| `/teams`, `/teams/new`, `/profile`            | Signed in                                   |
| `/admin/activities`                           | Signed-in platform administrator            |
| `/teams/:teamId` plus `/progress`, `/history` | Signed-in member of that team               |
| `/teams/:teamId/settings`                     | Team administrator home (members may leave) |

After sign-in, `next` is honoured only for in-app relative paths. The default home is today when the caller belongs to exactly one team.

Unknown or forbidden team routes follow the same empty or not-found treatment as the API's 404 behaviour and must not leak other teams' names or data.

## Data flow

```text
Page or feature
    → src/services
        → REST JSON /api/v1
```

- Shared resource shapes live in `src/types` as JSDoc `@typedef`s.
- Pages may call `src/services`. Presentational components in `src/components` (and feature UI that is only presentational) must not import `src/services` or `fetch`.
- The client does not decide which activity is featured, whether a completion is unique, or whether the user may invite members.
- Optimistic UI is optional later; the MVP waits for the server response.

## Auth session

JWT bearer token in `localStorage` via `src/services/session-store.js`. Unauthenticated users are sent to sign in. A 401 on an authenticated request clears the token and returns to public routes.

## Daily activity UX contract

The activity page shows:

- Title
- Instructions
- Estimated time
- Category
- Complete control
- Skip

Every member of a team sees the same activity because the API is the source of truth. Completing is a single idempotent action; the UI disables after success, but it must tolerate a repeat submit without treating it as a new event.

## Progress UX contract

The dashboard shows team-level information: member count, how many completed today's activity, participation percentage, and recent days. It does not present a default leaderboard of individuals and does not expose private answers.

## State

- **Server state:** current user, memberships, today's activity, completions, progress, history.
- **Local UI state:** form fields, transient errors, simple open/closed controls.

Keep state management simple. Do not introduce Redux or equivalent unless later complexity requires it.

## Responsive behaviour

One web app for desktop, tablet, and mobile browsers. Layout should remain usable without a native app. Primary actions (complete, skip, join, create team) must be reachable on a small viewport.

## Error and empty states

| State                                      | Intent                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| Unauthenticated                            | Sign in or register                                                 |
| Authenticated but not a member of any team | Create or join a team                                               |
| Not a member of the requested team         | Not found or no access, without leaking the team                    |
| Already completed                          | Confirm completion; do not invite a second complete as a new record |
| Skipped                                    | Acknowledge skip without penalty language                           |
| Network or server failure                  | Recoverable error, no lost private text implied                     |

## Target tests

- Unit tests for view logic (formatting participation, disabled complete after success, skip affordance)
- Browser end-to-end for the critical journey: register → create or join a team → see today's activity → complete → see team progress
- Coverage of skip, unauthenticated access to team routes, and basic mobile viewport for the activity page
