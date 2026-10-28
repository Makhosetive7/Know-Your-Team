# Team coding standards playbook

**Goal:** Keep Know Your Team consistent when contributors use different editors, models, and LLMs.

**Principle:** Do not rely on a model to remember the rules. Write them down once in [AGENTS.md](../AGENTS.md), then make the repository enforce them automatically. Whoever (or whatever) writes the code, anything that does not conform gets rejected.

This playbook is adapted to this repository. The stack is React + JavaScript + Vite and Python FastAPI with PostgreSQL. Ignore generic templates that assume Express, MongoDB, TypeScript, or a single root `npm` app.

---

## 0. Master checklist

### Phase 1: Document the rules

- [x] Create `AGENTS.md` (single source of truth for AI tools)
- [x] Create pointer files (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`)
- [x] Create `CONTRIBUTING.md`
- [x] Create a reference spec ([reference-module.md](reference-module.md)); replace with real feature folders when code exists
- [x] Language standards: [frontend](coding-standards-frontend.md) and [backend](coding-standards-backend.md)

### Phase 2: Tooling that enforces style

- [x] `.editorconfig`
- [x] Shared VS Code settings and extension recommendations
- [ ] Prettier (when `frontend/package.json` exists)
- [ ] ESLint shared config (when frontend code exists)
- [ ] Ruff + mypy in `backend/pyproject.toml`

### Phase 3: Block bad code locally

- [ ] Husky + lint-staged for JS/JSX (frontend or repo root when package manifests exist)
- [ ] `pre-commit` for Python (Ruff, format, mypy)
- [ ] Conventional commit linting (commitlint)

### Phase 4: Block bad code in CI

- [ ] GitHub Actions: frontend lint, test, build
- [ ] GitHub Actions: backend Ruff, mypy, pytest
- [ ] Commitlint on pull requests
- [ ] Mark checks as required on `main` (GitHub settings; cannot live in git)

### Phase 5: Protect the repo

- [ ] Branch protection on `main` (GitHub settings)
- [x] `CODEOWNERS` template (uncomment and set real GitHub users or teams)
- [x] PR template

### Phase 6: Tests, dependencies, architecture

- [ ] Testing rules enforced with a coverage floor
- [ ] Lockfiles committed; Dependabot or Renovate enabled
- [ ] Architecture boundary checks (for example dependency-cruiser on `frontend/src`)

### Phase 7: Team habits

- [x] Prompting conventions (this playbook and CONTRIBUTING.md)
- [x] Review checklist for AI-generated code
- [ ] Short onboarding for new contributors when the team is more than one person

Phase 1 is done. Phase 2 is done for EditorConfig and VS Code only. Prettier, ESLint, Ruff, and mypy wait for application packages. Do not add npm, pip, or CI jobs that would fail because those packages do not exist yet.

---

## 1. Document the rules

### 1.1 `AGENTS.md`

Every AI tool reads a different filename. Maintain [AGENTS.md](../AGENTS.md) and point the others at it.

Do not copy Express/Mongo examples into it. Do not wrap FastAPI responses in a `{ success, data, error }` envelope; this API uses HTTP status codes (see AGENTS.md). Function, type, and declaration rules live in [coding-standards-frontend.md](coding-standards-frontend.md) and [coding-standards-backend.md](coding-standards-backend.md).

### 1.2 Pointer files

These are one-line (or short) files so they cannot drift:

- [CLAUDE.md](../CLAUDE.md)
- [.cursorrules](../.cursorrules)
- [.github/copilot-instructions.md](../.github/copilot-instructions.md)

Cursor project rules in `.cursor/rules/` summarise the same ideas for the agent. If a Cursor rule disagrees with AGENTS.md, AGENTS.md wins and the rule should be fixed.

### 1.3 `CONTRIBUTING.md`

Human process: setup, branches, Conventional Commits, PRs, tests, AI policy. See [CONTRIBUTING.md](../CONTRIBUTING.md).

### 1.4 Reference module

Until code exists, [reference-module.md](reference-module.md) is the gold standard. After implementation, point AGENTS.md at:

- `frontend/src/features/activities/`
- `backend/app/services/` (daily assignment and completion)

---

## 2. Tooling that enforces style

Land these **with the first application code**, not as empty configs that cannot run.

### 2.1 `.editorconfig`

Already in the repo. Python uses 4-space indent; everything else 2 spaces; LF; UTF-8; final newline.

### 2.2 Prettier (frontend, later)

`.prettierrc` (intended):

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

Ignore `node_modules`, `dist`, `build`, `coverage`, and lockfiles.

### 2.3 ESLint (frontend, later)

Flat config for JavaScript and JSX: `@eslint/js` recommended, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsdoc`, Prettier last. Required rules:

- `eqeqeq`: always
- `no-console`: warn, allow `warn` and `error`
- `prefer-const`: error
- `no-var`: error
- `no-unused-vars`: error, args starting with `_` ignored
- `jsdoc/require-jsdoc` on exported functions
- `jsdoc/require-param` and `jsdoc/require-returns` on those exports (components that only return JSX may omit `@returns`)

JSDoc is how this frontend gets autocomplete and reviewable shapes. Without `eslint-plugin-jsdoc`, those tags are optional comments. Do not add `typescript-eslint` or a `tsconfig.json`.

### 2.4 Python (later)

`backend/pyproject.toml` intended tooling:

```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "B", "A", "C4", "SIM", "S"]

[tool.ruff.format]
quote-style = "double"

[tool.mypy]
strict = true
python_version = "3.11"
plugins = ["pydantic.mypy"]
```

### 2.5 Shared VS Code settings

Already in `.vscode/`. Python files format with Ruff when that extension is installed; other files with Prettier when that extension is installed. Format-on-save is on.

### 2.6 Scripts (later)

`frontend/package.json` should expose `lint`, `lint:fix`, `format`, `format:check`, `test`, and a single `check` that runs format check, lint, and tests.

Backend checks stay as `ruff check .`, `ruff format --check .`, `mypy .`, and `pytest` from `backend/`.

---

## 3. Block bad code locally

Hooks are fast feedback. They can be bypassed with `--no-verify`. **CI is the real gate.**

When package manifests exist:

- Husky `pre-commit` runs lint-staged (ESLint + Prettier on JS/JSX; Prettier on json/md/css/yml).
- Husky `commit-msg` runs commitlint with `@commitlint/config-conventional`.
- Python `pre-commit` runs `ruff`, `ruff-format`, and `mypy` on `backend/`.

Do not install Husky in this docs-only state; there is no `package.json` to attach it to.

---

## 4. Block bad code in CI

Intended workflow (add as `.github/workflows/ci.yml` when apps can install):

- **frontend:** `npm ci` in `frontend/`, then format check, lint, test, build. Node 20. Cache npm.
- **backend:** Python 3.11, install from the chosen lockfile or `pyproject.toml`, then Ruff check, Ruff format check, mypy, pytest.
- **commit-lint:** on pull requests, lint commit messages from base SHA to head SHA.

Use `npm ci` in CI, never `npm install`.

Required status checks are configured in GitHub branch protection, not in this file.

---

## 5. Protect the repo

### 5.1 Branch protection on `main`

In GitHub: Settings → Branches → Add rule.

- Require a pull request before merging
- Require at least 1 approving review
- Dismiss stale approvals when new commits are pushed
- Require the CI jobs above to pass
- Require branches to be up to date before merging
- Require conversation resolution
- Block force pushes and deletions
- Apply the rules to administrators too

### 5.2 `CODEOWNERS`

[.github/CODEOWNERS](../.github/CODEOWNERS) is a commented template so GitHub does not request reviews from a fake handle. Uncomment and set real users or teams before relying on it. Changes to `AGENTS.md`, `.github/`, and this playbook should always need a maintainer.

### 5.3 PR template

Already in [.github/pull_request_template.md](../.github/pull_request_template.md).

---

## 6. Tests, dependencies, architecture

### 6.1 Testing rules

- Every new feature or bug fix includes tests.
- Bug fixes start with a failing test that reproduces the bug.
- Unit tests for logic; integration tests for API, database, permissions, timezone assignment, duplicate completions.
- Browser e2e for register → join → complete → progress.
- Coverage floor (for example 70% lines) once a runner exists; raise it over time.
- Deterministic tests only.

### 6.2 Dependency control

- Commit lockfiles (`frontend/package-lock.json`, backend lockfile when chosen).
- Any new dependency in a PR must be justified. Verify the package exists (LLMs invent names). Verify it does not duplicate existing functionality or introduce unmaintained or bloated security risk.
- Use `npm ci` in CI, never `npm install`.
- Enable Dependabot or Renovate later with ecosystems `npm` (`/frontend`), `pip` (`/backend`), and `github-actions` (`/`). Assign those PRs so patches do not wait on ad-hoc maintenance.

### 6.3 Architecture boundary checks

Presentational components must never import API methods from `src/services/` or invent business rules. Pages and hooks call services; services call `/api/v1`.

No circular dependencies. No reaching into another feature's internals; use that feature's public exports.

The frontend must never import `backend/`. The backend must never import `frontend/`. Shared knowledge is HTTP JSON and JSDoc/Pydantic shapes, not a shared source tree.

When `frontend/src` exists, add dependency-cruiser (or equivalent) in CI so those rules fail the build. Until a Python import linter is worth it, backend layering is reviews plus tests: routers stay thin; services own rules; repositories do not skip services for writes that have rules and do not encode authorisation.

---

## 7. Team habits

### 7.1 Prompting conventions

When using LLMs, agents, or Cursor, prime the session first:

> Read `AGENTS.md`, `CONTRIBUTING.md`, and the language standard (`docs/coding-standards-frontend.md` or `docs/coding-standards-backend.md`) before generating code. Follow `docs/reference-module.md` (or `frontend/src/features/activities/` when it exists). Reuse existing utilities. Do not add dependencies. Keep the change small and scoped to this task. Add or update tests. Run frontend `npm run check` and backend `ruff` / `mypy` / `pytest` before you finish. Do not add Express, MongoDB, TypeScript, or a success/data envelope.

Give the model the real Pydantic schemas, JSDoc typedefs, or table shapes. Do not let it invent placeholder fields.

Other habits:

- One task per prompt or session.
- Paste the exact error output when asking for fixes.
- Ask the model to explain non-obvious changes, then verify them yourself.
- If the model suggests changing a lint rule or config to make code pass, reject it. Fix the code.

### 7.2 AI code review checklist

Before approving AI-generated work, a human verifies:

- **No hallucinated libraries.** Package exists, is maintained, and was requested or justified. No phantom imports.
- **Strict typing compliance.** Backend: `mypy .` with `strict = true` in `pyproject.toml`. Frontend: JSDoc `@param` / `@returns` / `@typedef` on public exports (`eslint-plugin-jsdoc` when it exists).
- **No boolean traps.** Split functions (`complete_daily_activity` vs `skip_daily_activity`). No hidden `skip: bool` that changes behaviour.
- **Idempotent safety.** Writes use get-or-create or catch `sqlalchemy.exc.IntegrityError` and re-read. No raw insert-and-hope.
- **Thin routers and presenters.** Business logic has not bled into routers, presentational components, or repositories.
- **Architecture isolation.** No `frontend/` ↔ `backend/` imports. UI does not call fetch except through `src/services`.
- **No duplicate helpers.** Search the tree before adding a new utility.
- **No weakened gates.** Tests not deleted or emptied; lint/type rules not disabled to go green.
- **No secrets or leftovers.** No hardcoded credentials, debug `console.log` / `print`, commented-out blocks, or placeholder data.
- **Authz and validation.** Input validated at the HTTP edge. Membership and roles enforced on the server.
- **Privacy.** No individual rankings, no private answers on admin views, complete ≠ share.
- **No TypeScript** on the frontend (`.ts` / `.tsx`).
- **Scope.** Diff matches the task. No drive-by refactors.

### 7.3 Accountability

- The PR author owns the code, regardless of which tool wrote it.
- "The AI wrote it" is never a valid answer in review.
- Authors must be able to explain every line.

---

## 8. Recommended rollout order

| Order | Task                                              | When                                     |
| ----- | ------------------------------------------------- | ---------------------------------------- |
| 1     | `AGENTS.md` + `CONTRIBUTING.md` + playbook        | Done                                     |
| 2     | EditorConfig + VS Code + PR template              | Done                                     |
| 3     | Prettier + ESLint + Ruff/mypy                     | First application code                   |
| 4     | GitHub Actions CI with required checks            | When `check` scripts can pass            |
| 5     | Branch protection + real CODEOWNERS               | When GitHub remote and team exist        |
| 6     | Husky + lint-staged + commitlint + pre-commit     | Same time as CI                          |
| 7     | Real reference feature to imitate                 | First vertical slice (activity complete) |
| 8     | Coverage floor + Dependabot                       | After tests run in CI                    |
| 9     | Architecture rules (dependency-cruiser)           | After frontend `src/` exists             |
| 10    | Onboarding session                                | When a second contributor joins          |

Steps 1–2 are what a docs-only repo can honestly ship. Empty lint configs that cannot run are not enforcement.

---

## 9. Ongoing maintenance

- Review `AGENTS.md` when the same mistake shows up in reviews twice. Add a rule and, if possible, a lint or test.
- Prefer automating a rule over documenting it.
- Treat rules files as code: changes go through PRs.
- Keep tooling versions current so editors and CI behave the same.

---

## 10. Definition of done (per PR)

- [ ] Code follows `AGENTS.md` and the reference module
- [ ] Frontend `npm run check` and backend Ruff/mypy/pytest pass locally and in CI (when those exist)
- [ ] Tests cover the new or changed behaviour
- [ ] No new dependencies, or each one is justified
- [ ] PR template completed
- [ ] At least one human reviewer approved (when branch protection is on)
- [ ] Docs updated if behaviour or setup changed
- [ ] Privacy boundaries still hold: team-level progress, skip without penalty, complete ≠ share
