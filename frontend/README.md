# Frontend

The Know Your Team web app is a responsive browser interface for daily team activities. Native Android and iOS apps are not part of the MVP.

See [frontend architecture](ARCHITECTURE.md) for module design, the [unified architecture](../ARCHITECTURE.md) for system context, and [frontend coding standards](../docs/coding-standards-frontend.md) for functions, types, and declarations.

## Stack

- React, JavaScript (ES modules + JSX), Vite
- styled-components (styles at the bottom of each component file)
- react-router
- JWT bearer token stored by `src/services` when those calls exist; no extra auth library
- Vitest + Testing Library for unit tests; Playwright for browser journeys
- ESLint (js, react, hooks, jsdoc) and Prettier

Do not add TypeScript, Redux, Axios, or a UI kit.

## Type and color

Tokens live in [`src/styles/theme.js`](src/styles/theme.js). Do not hard-code hex values or font names in components.

| Use                      | Face     |
| ------------------------ | -------- |
| UI, body, buttons        | Figtree  |
| Page and activity titles | Fraunces |

Fonts are self-hosted with `@fontsource` so the app does not call Google Fonts at runtime.

| Token        | Hex       | Use                                     |
| ------------ | --------- | --------------------------------------- |
| `bg`         | `#F4EFE8` | Page background                         |
| `surface`    | `#FFFBF6` | Cards                                   |
| `ink`        | `#1C1714` | Primary text                            |
| `inkMuted`   | `#5C534C` | Secondary text and skip                 |
| `accent`     | `#1F6B57` | Primary actions, complete, links, focus |
| `accentSoft` | `#DCEEE7` | Selected or completed wash              |
| `border`     | `#E4D9CC` | Hairlines                               |
| `danger`     | `#B42318` | Form and API errors only                |

Skip is muted stone, never red. Red is for real errors.

## Layout

```text
frontend/
├── e2e/
├── src/
│   ├── components/
│   ├── features/{auth,activities,progress}/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── types/
│   ├── App.jsx
│   └── main.jsx
├── index.html
└── package.json
```

Public routes: `/`, `/sign-in`, `/register`, `/join`. Signed-in routes live under `/teams` and `/profile`. JWT bearer tokens are stored in `localStorage` by `src/services/session-store.js`. `src/services` is the only `fetch` boundary.

## Primary screens

- Sign in and register
- Create a team
- Join a team (invitation link or code)
- Today's activity (complete or skip)
- Team progress
- Activity history
- Basic profile

## Setup, run, and test

Requires Node 20.19 or later. From `frontend/`:

```text
npm ci
npm run dev
```

The Vite dev server is `http://localhost:5173` and proxies `/api` to the FastAPI app on `http://127.0.0.1:8000`. Set `VITE_API_PROXY_TARGET` if the API is on another origin. CORS on the API also allows the Vite origin.

| Script                 | Purpose                            |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Vite dev server                    |
| `npm run build`        | Production bundle                  |
| `npm run lint`         | ESLint                             |
| `npm run format`       | Prettier write                     |
| `npm run format:check` | Prettier check                     |
| `npm test`             | Vitest                             |
| `npm run test:e2e`     | Playwright smoke tests             |
| `npm run check`        | Format check, lint, and unit tests |

## How it talks to the API

`src/services` is the only HTTP boundary. Pages and hooks call services; services call `/api/v1`. The client does not invent assignment, uniqueness, or permission rules. Those live on the server.

## Product UX principles

- Lightweight, friendly, and understandable without onboarding sessions
- One featured activity per team per day
- Skip without penalty
- No individual ranking UI by default
- Works on desktop, tablet, and mobile browsers
- Completing an activity is not the same as sharing a personal answer
