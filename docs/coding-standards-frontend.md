# Frontend coding standards

Language-level rules for `frontend/`. Architecture and boundaries stay in [frontend/ARCHITECTURE.md](../frontend/ARCHITECTURE.md). Project-wide rules stay in [AGENTS.md](../AGENTS.md). If this file disagrees with AGENTS.md, AGENTS.md wins.

Stack: React function components, JavaScript (ES modules + JSX), Vite. No TypeScript. Named exports.

---

## Declarations

Use `const` by default. Use `let` only when the binding is reassigned. Never use `var`.

```js
// BAD
var count = 0;
let title = "Today’s activity";

// GOOD
const title = "Today’s activity";
let retryCount = 0;
retryCount += 1;
```

Module-level constants are `UPPER_SNAKE_CASE`. Local values and functions are `camelCase`. Components, hooks that produce UI types, and constructor-like names are `PascalCase`.

```js
export const MAX_TEAM_NAME_LENGTH = 80;
export const MEMBERSHIP_ROLE = Object.freeze({
  MEMBER: "member",
  TEAM_ADMINISTRATOR: "team_administrator",
});

/**
 * @param {object} params
 * @param {number} params.completedCount
 * @param {number} params.memberCount
 * @returns {number}
 */
export function formatParticipation({ completedCount, memberCount }) {
  if (memberCount === 0) {
    return 0;
  }
  return Math.round((completedCount / memberCount) * 100);
}
```

Always declare bindings. Do not rely on implicit globals. Prefer `Object.freeze` for small constant maps of allowed strings (roles, statuses).

Files are `.js` for logic and `.jsx` for React components. Do not add `.ts` or `.tsx` files.

### File names

Frontend files are **kebab-case**, including hooks. The export inside the file stays camelCase or PascalCase. This is the JavaScript convention for this package; it is not snake_case like Python modules. Do not mix `useDailyActivity.js` and `use-daily-activity.js`.

| Kind | File name | Named export |
|------|-----------|--------------|
| Component | `ActivityCard.jsx` | `ActivityCard` |
| Hook | `use-daily-activity.js` | `useDailyActivity` |
| Service | `activity-service.js` | `completeDailyActivity` |
| Shared shapes | `activity.js` in `src/types/` | JSDoc `@typedef` plus `export {}` |

The file name for a component must match the export (`ActivityCard.jsx` exports `ActivityCard`). Hooks always start with `use-` in the file name and `use` in the export.

---

## Functions

Top-level functions and React components use `function` declarations. Arrow functions are for callbacks, small mappers, and values that must be expressions.

```jsx
// BAD — default export, class component, untyped grab-bag props
export default function ActivityCard(props) {
  return <h2>{props.title}</h2>;
}

// GOOD
/**
 * @typedef {object} ActivityCardProps
 * @property {string} title
 * @property {number} estimatedMinutes
 * @property {() => void} onComplete
 */

/**
 * @param {ActivityCardProps} props
 */
export function ActivityCard({ title, estimatedMinutes, onComplete }) {
  return (
    <article>
      <h2>{title}</h2>
      <p>{estimatedMinutes} min</p>
      <button type="button" onClick={onComplete}>
        Mark complete
      </button>
    </article>
  );
}
```

Rules:

- Named exports only. No default exports.
- One component per file. File name matches the component: `ActivityCard.jsx`.
- Hooks are `function useThing(...)` and start with `use`.
- Document public functions and component props with JSDoc (`@param`, `@returns`, `@typedef`). Skip JSDoc on trivial local arrows. ESLint (`eslint-plugin-jsdoc`) must require `@param` and `@returns` on exported functions when that config exists. Components that only return JSX still need `@param` for props; `@returns` may be omitted for those.
- Prefer early returns over nested `if`.
- Do not use a boolean flag that secretly switches two behaviours. Use two functions.
- `async` only for actual I/O. Do not mark a function `async` just to wrap a value you already have.
- Call `src/services` from hooks or pages, not from presentational components if that can be avoided. Components receive data and callbacks as props.
- Use `===` / `!==`. Never `==` / `!=` except `== null` when you intentionally mean both `null` and `undefined`.

```js
// BAD
export async function getCachedTitle(title) {
  return title;
}

export function handleActivity(complete, skip) {}

// GOOD
export function getCachedTitle(title) {
  return title;
}

/**
 * @param {string} teamId
 * @returns {Promise<object>}
 */
export async function completeDailyActivity(teamId) {
  return postJson(`/api/v1/teams/${teamId}/daily-activity/complete`);
}
```

Event handlers: `onSomething` in props, `handleSomething` inside the component.

```jsx
/**
 * @param {object} props
 * @param {() => void} props.onSkip
 */
export function SkipButton({ onSkip }) {
  function handleClick() {
    onSkip();
  }

  return (
    <button type="button" onClick={handleClick}>
      Skip
    </button>
  );
}
```

Parameters: destructure props objects. For two or more values that could be swapped (two numbers, two ids), take a single options object. Never default a parameter to `[]`.

In JavaScript, `function f(items = [])` creates a **new** array on every call. It does not share one list the way Python does. We still ban it: optional collections must be explicit in JSDoc and at the call site (omitted vs an empty list). A destructured options object may default to `{}` so `collectIds()` is valid; do not mutate that object.

```js
// BAD
function collectIds(ids = []) {
  return ids;
}

// GOOD
/**
 * @param {object} [params]
 * @param {string[]} [params.ids]
 * @returns {string[]}
 */
export function collectIds({ ids } = {}) {
  return ids ?? [];
}
```

```js
// BAD
function reportProgress(completed, members) {}
reportProgress(members, completed);

// GOOD
/**
 * @param {object} params
 * @param {number} params.completedCount
 * @param {number} params.memberCount
 * @returns {number}
 */
export function participationPercent({ completedCount, memberCount }) {
  if (memberCount === 0) {
    return 0;
  }
  return Math.round((completedCount / memberCount) * 100);
}
```

---

## Shapes and JSDoc (our stand-in for types)

There is no TypeScript. Document shared shapes with JSDoc `@typedef` in `src/types/` so services, hooks, and components name the same objects.

```js
/**
 * @typedef {string} TeamId
 * @typedef {string} UserId
 */

/**
 * @typedef {'member' | 'team_administrator'} MembershipRole
 */

/**
 * @typedef {object} Team
 * @property {TeamId} id
 * @property {string} name
 * @property {string} timezone
 */

/**
 * @typedef {'available' | 'completed' | 'skipped'} DailyActivityStatus
 */

/**
 * @typedef {object} DailyActivity
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} instructions
 * @property {number} estimatedMinutes
 * @property {string} category
 * @property {DailyActivityStatus} status
 */

export {};
```

The empty `export {}` makes the file an ES module so `@typedef`s can be imported with JSDoc:

```js
/** @typedef {import('../types/activity').DailyActivity} DailyActivity */
```

### Runtime values vs comments

- Allowed string values that the UI branches on also exist as frozen constants (`MEMBERSHIP_ROLE`, `DAILY_ACTIVITY_STATUS`). JSDoc unions describe them; constants are what code uses.
- Do not add `prop-types` unless we later decide we need runtime React warnings. JSDoc is enough for the MVP.
- Do not add TypeScript later in a side folder. A language change is a standards PR, not a drive-by.

### Null and empty

- `null` means the API sent an empty value (for example `avatarUrl: null`).
- Omitted / optional props mean the caller did not pass the key (`initialName` may be missing).
- Do not mix `null` and `undefined` for the same field.

```js
/**
 * @typedef {object} CurrentUser
 * @property {UserId} id
 * @property {string} displayName
 * @property {string | null} avatarUrl
 */

/**
 * @typedef {object} ProfileFormProps
 * @property {string} [initialName]
 * @property {(name: string) => void} onSave
 */
```

### HTTP helpers

Keep generics in JSDoc on the service boundary only. UI code should name a typedef, not invent ad-hoc objects.

```js
/**
 * @template T
 * @param {string} path
 * @returns {Promise<T>}
 */
export async function getJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response.json();
}
```

### React state

Pass an explicit initial value. Use `null` for “not loaded yet”, not a magic empty object.

```jsx
const [activity, setActivity] = useState(null);
```

Do not use `React.FC` (TypeScript-only). Do not use class components.

---

## Modules and files

See [File names](#file-names). Imports: external packages, then internal aliases, then relative. Do not import from `backend/`.

When ESLint is added, include `eslint-plugin-jsdoc` so public methods actually have `@param` and `@returns`. JSDoc without that lint is a comment, not a check.

---

## Do not

- TypeScript (`.ts`, `.tsx`, `enum`, `interface`, `type` aliases, `as any`)
- `var`, default exports, class components, `React.FC`
- Classes for UI or for API clients (functions + modules)
- Default arguments of `[]` (`function f(items = [])`). Optional lists: omit the key and use `ids ?? []` inside.
- `==` except `== null` when intentional
- `console.log` in committed code (`console.warn` / `console.error` only)
- `eslint-disable` without a comment explaining why
- Business rules that belong on the server
