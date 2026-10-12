# AGENTS.md

Guidance for AI agents working in this repository. Read this first to get up to speed quickly.

## Project overview

StudySpace (`studySpaceFe`) is the frontend for an LMS portal. It is a React 19 + TypeScript single-page app that talks to a separate ASP.NET Core Web API backend. Users are students, teachers, and admins.

- Frontend repo: `NiklasSod/studySpaceFe` (this repo)
- Backend repo: `NiklasSod/lmsPortalBe`
- Dev proxy: `/api` is proxied to `http://localhost:5250` (see [vite.config.ts](vite.config.ts))

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and produce a production build |
| `npm run lint` | ESLint (`eslint .`) |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

Use `npx tsc -b --pretty false` for a fast type-check and `npx eslint <files>` for targeted linting.

## Stack

- **React 19** + **TypeScript** (strict, `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters`)
- **Vite 8** (Rolldown)
- **react-router-dom 7** for routing
- **react-bootstrap 2 + bootstrap 5** for UI (no custom CSS framework)
- **react-bootstrap-icons** for icons
- **DOMPurify** for rich-text sanitization
- **TipTap** for the rich text editor
- **ESLint 10** with `eslint-plugin-react-hooks` flat config (includes the React Compiler `set-state-in-effect` rule — avoid calling `setState` synchronously inside `useEffect`; prefer event handlers or `useState` initializers)

## Directory layout

```
src/
  api/          # One module per backend domain; thin fetch wrappers returning typed promises
  auth/         # AuthContext + AuthProvider (session state)
  components/   # Reusable UI; subfolders per domain (assignments/, courses/, profile/, ...)
  editMode/     # EditModeContext + provider (teacher edit-mode toggle, persisted in localStorage)
  hooks/        # Custom hooks (useTheme)
  routes/       # StudentRoutes / TeacherRoutes (role-specific nested routes)
  types/        # Pure TypeScript interfaces for API DTOs and requests
  utils/        # Cross-cutting helpers (apiFetch, apiError, themeHandler, ...)
  views/        # Page-level components, one folder per area (auth/, courses/, ...)
  App.tsx       # Top-level routing split by auth state and role
  main.tsx      # Entry: BrowserRouter > AuthProvider > EditModeProvider > App
```

## Architecture conventions

### API layer

- **Authenticated calls** go through [apiFetch](src/utils/apiFetch.ts), which:
  - attaches `Authorization: Bearer <token>` from sessionStorage,
  - sets `Content-Type: application/json` unless the body is `FormData`,
  - proactively refreshes the token if it expires within 60s,
  - retries once on 401 after a silent refresh.
- **Public auth calls** (login, register, forgot/reset password, refresh, logout) use raw `fetch` with `credentials: 'include'` directly in [api/auth.ts](src/api/auth.ts) — they must not depend on a token.
- Error handling: use `parseApiError(res, fallback)` to turn a non-OK response into a user-facing message, or `toApiError(res, fallback)` when you need the status code. Both live in [utils/apiError.ts](src/utils/apiError.ts).
- Request/response types live in [src/types](src/types). Name request types `XxxRequest`, responses/DTOs after the domain model (e.g. `Assignment`, `UserDto`).
- Endpoint casing is inconsistent (e.g. `/api/Assignments/...` vs `/api/submissions/...`); match the existing casing used by the same domain module rather than normalizing it.

Example shape:

```ts
export async function updateCourse(id: number, request: UpdateCourseRequest) {
  const res = await apiFetch(`/api/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    throw new Error(await parseApiError(res, 'Could not update course.'))
  }
  return res.json()
}
```

### Auth & session

- Tokens are stored in `sessionStorage` (`accessToken`, `expiresAt`); the refresh token is an HTTP-only cookie.
- Consume auth state via `useAuth()` from [auth/AuthContext.ts](src/auth/AuthContext.ts): `isLoggedIn`, `isRestoring`, `role` (`student` | `teacher` | `admin`), `fullName`, `email`, `userId`, and `login`/`register`/`logout`.
- The `JWT` payload is decoded client-side (claims may use `given_name`/`family_name`, `sub`/`nameid`, and several `role` claim variants).

### Routing & roles

- [App.tsx](src/App.tsx) renders different route trees depending on `isLoggedIn` and `role`.
- Public routes: `/login`, `/register`, `/reset-password` (everything else redirects to `/login`).
- Authenticated routes: `/student/*` and `/teacher/*` (plus `/admin/*`) under [AppLayout](src/components/AppLayout.tsx); each role's routes are declared in [routes/StudentRoutes.tsx](src/routes/StudentRoutes.tsx) and [routes/TeacherRoutes.tsx](src/routes/TeacherRoutes.tsx).
- Add a new public page by importing the view into `App.tsx` and adding a `<Route>` before the `*` catch-all.

### Styling & theming

The app supports a light and a dark theme, switched via the `data-bs-theme` attribute on `<html>`. **Every new component, view, and inline style must work in both themes** — never hard-code colors; always use the CSS custom properties.

- Bootstrap utility classes are the primary styling mechanism; inline styles are used for one-off values.
- Theme colors come from CSS custom properties defined in [src/index.css](src/index.css) under `:root`/`[data-bs-theme='light']` and `[data-bs-theme='dark']`:
  - `--card-bg`, `--text-primary`, `--text-secondary`, `--link-color`
  - `--btn-bg`, `--btn-text`, `--logo-bg`, `--logo-border`
  - `--input-bg`, `--input-text`, `--input-border`, `--navbar-bg`
- Always prefer these variables over Bootstrap's default colors where a themed color is intended (buttons, inputs, text, links, card backgrounds). Reuse the existing pattern rather than inventing new hard-coded values.
- If you genuinely need a new color token, add it to **both** the light and dark blocks in [src/index.css](src/index.css).
- Standard themed input styling pattern (repeated across the codebase):

```ts
const inputStyle = {
  borderRadius: '6px',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--input-text)',
  borderColor: 'var(--input-border)',
}
```

- Theme logic lives in [utils/themeHandler.ts](src/utils/themeHandler.ts) and [hooks/useTheme.ts](src/hooks/useTheme.ts).

### Rich text

- Rich text is sanitized with DOMPurify through [sanitizeRichText](src/utils/richTextSanitize.ts) before rendering; the allowlist mirrors the backend sanitizer (p, br, b, strong, i, em, u, s, ul, ol, li, h1-h4, a, span; attrs href/style).
- Internal references use markdown-ish syntax like `/activities/5` or `[label](/resources/9)`; parsing/rendering helpers are in [utils/internalLinks.ts](src/utils/internalLinks.ts).
- Use [RichTextEditor](src/components/richText/RichTextEditor.tsx) (TipTap) for editing and the read-only `RichText`/`ClampedRichText` components for display.

## Component & code conventions

- Function components with hooks; no class components.
- Prefer creating a small reusable component over copying code (e.g. `ForgotPasswordModal`).
- Modals: use react-bootstrap `<Modal show onHide centered>`; reset form state in `onShow` (not in a `useEffect` over `show`, which trips the `set-state-in-effect` lint rule), and clean up timers with an unmount effect.
- Forms: use react-bootstrap `<Form>`, `Form.Group` with `controlId`, `Form.Control`, and `Form.Control.Feedback` for validation messages. Use `noValidate` and manual validation when custom error display is needed.
- Style form inputs with the theme variables (see the input pattern in the styling section) so they render correctly in both light and dark mode.
- Password fields get a show/hide toggle using `react-bootstrap-icons` `Eye`/`EyeSlash` inside an `InputGroup` (see [LoginView](src/views/auth/LoginView.tsx)).
- Icons come from `react-bootstrap-icons` (e.g. `import { Eye, EyeSlash } from 'react-bootstrap-icons'`).

## Noteworthy details

- `BrandLogo` in [components/BrandLogo.tsx](src/components/BrandLogo.tsx) renders the app logo; reuse it rather than hand-rolling a logo.
- `EditModeProvider` toggles teacher edit controls and persists to `localStorage` under the `editMode` key.
- [imageCompression.ts](src/utils/imageCompression.ts) compresses uploaded images before upload; [submissionStatus.ts](src/utils/submissionStatus.ts) and [enrollmentStatus.ts](src/utils/enrollmentStatus.ts) map backend status strings to labels/colors.
- File uploads (`Blob`/`FormData`) go through `apiFetch` — it skips the JSON content-type header automatically for `FormData` bodies.

## Before submitting changes

1. Run `npx tsc -b --pretty false` (or `npm run build`) — type errors fail CI.
2. Run `npx eslint <changed files>` — keep lint clean.
3. Match surrounding code style (Prettier defaults; the repo does not use semicolons inconsistently — follow the file you are editing).
