# Contributing

Thank you for helping build Know Your Team. The author of a change owns it, including code written with an AI tool. "The AI wrote it" is not an acceptable answer in review.

## Before you start

1. Read [AGENTS.md](AGENTS.md).
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) and the package architecture for the area you are changing.
3. Read the language standard for that package: [frontend](docs/coding-standards-frontend.md) or [backend](docs/coding-standards-backend.md).
4. Skim [docs/coding-standards-playbook.md](docs/coding-standards-playbook.md) so you know what is enforced now versus later.

## Setup

This repository is still documentation-first. There is no application install yet.

When application code exists:

1. Clone the repository.
2. Copy environment templates (when added) to local env files. Never commit secrets.
3. Frontend: `cd frontend && npm ci && npm run dev`
4. Backend: follow [backend/README.md](backend/README.md) (PostgreSQL, migrations, FastAPI).
5. Run the checks listed in AGENTS.md before you open a pull request.

## Branch naming

- `feat/…` — new behaviour
- `fix/…` — bug fix
- `chore/…` — tooling, deps, housekeeping
- `docs/…` — documentation only
- `test/…` — tests only
- `refactor/…` — no behaviour change

Keep branches short-lived and scoped to one change.

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: assign one daily activity per team timezone
fix: prevent duplicate activity completions
docs: add backend architecture
chore: add ruff configuration
```

- Subject in imperative mood, no trailing period.
- Scope optional (`feat(api): …`, `fix(web): …`).
- Do not commit generated noise, secrets, or unrelated files.

Commit linting will be enforced in CI when that workflow exists. Until then, follow this format by hand.

## Pull requests

- Small PRs. Linked issue when one exists.
- Complete the PR template checklist.
- Every behaviour change includes tests.
- No new dependencies unless justified in the PR.
- Reuse existing helpers instead of duplicating them.
- Docs updated if behaviour or setup changed.

## Testing expectations

- Unit tests for domain and view logic.
- Integration tests for API endpoints, permissions, timezone assignment, and idempotent completions.
- Browser end-to-end tests for the critical journey: register → join or create a team → complete today's activity → see team progress.
- Tests must be deterministic: no live network, real clock, or uncontrolled randomness.
- A coverage floor will be added with the first test runner. Do not delete or weaken tests to pass CI.

## AI usage policy

AI tools are allowed. You are fully responsible for every line you submit.

- Start sessions by asking the tool to read AGENTS.md, CONTRIBUTING.md, and the language standard (`docs/coding-standards-frontend.md` or `docs/coding-standards-backend.md`).
- One task per session. Keep the diff small.
- Paste exact error output when asking for fixes.
- Reject suggestions that disable lint rules, skip tests, or add dependencies "to make it work".
- You must be able to explain every line in review.

Reviewers should use the AI-generated code checklist in the [playbook](docs/coding-standards-playbook.md).

## Changing these standards

Treat `AGENTS.md`, this file, and the playbook as code. Change them in a pull request. Prefer adding an automated check (lint, test, CI) over adding another paragraph that people will ignore.

## Getting help

Open an issue or ask a maintainer. If the same review comment appears twice, add a rule to AGENTS.md and an automated check if possible.
