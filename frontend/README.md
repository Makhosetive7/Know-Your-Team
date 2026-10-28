# Frontend

The Know Your Team web app is a responsive browser interface for daily team activities. Native Android and iOS apps are not part of the MVP.

This package is documentation-only until application code exists. See [frontend architecture](ARCHITECTURE.md) for module design, the [unified architecture](../ARCHITECTURE.md) for system context, and [frontend coding standards](../docs/coding-standards-frontend.md) for functions, types, and declarations.

## Intended stack

- React
- JavaScript (ES modules + JSX)
- Vite
- Responsive CSS or a component library (choice deferred until UI work)

## Intended layout

```text
frontend/
├── src/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── teams/
│   │   ├── activities/
│   │   └── progress/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── types/
└── package.json
```

This tree is the target for implementation. It is not present yet.

## Primary screens

- Sign in and register
- Create a team
- Join a team (invitation link or code)
- Today's activity (complete or skip)
- Team progress
- Activity history
- Basic profile

## Setup, run, and test

To be filled when the application exists. No commands are documented yet.

## How it talks to the API

`src/services` is the only HTTP boundary. Pages and hooks call services; services call `/api/v1`. The client does not invent assignment, uniqueness, or permission rules. Those live on the server.

## Product UX principles

- Lightweight, friendly, and understandable without onboarding sessions
- One featured activity per team per day
- Skip without penalty
- No individual ranking UI by default
- Works on desktop, tablet, and mobile browsers
- Completing an activity is not the same as sharing a personal answer
