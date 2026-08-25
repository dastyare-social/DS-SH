# Dastyare Social — SH — Developer Guide

A complete, hands-on guide to **Dastyare Social — SH**: a self-hostable short-link service with a dashboard, redirect tracking, a REST API with OpenAPI docs, and Better Auth.

This guide complements `README.md` (quick start + self-hosting). It focuses on how the code is organized and how the pieces work together.

---

## 1. Overview

Dastyare Social — SH is a single Next.js app that provides:

- **Dashboard** — create, edit, enable/disable, and delete short links; view stats and redirect counts.
- **Public redirects** — `/r/<r_path>` shows a short countdown then redirects, recording the hit.
- **REST API** — create/update/delete links via `Authorization: Bearer <API_KEY>`.
- **tRPC layer** — used by the dashboard (protected) and the public redirect page.
- **OpenAPI docs** — interactive Scalar reference at `/docs`.

Design principles:

- **Result-object pattern**: every data-layer function returns `{ success: true, data }` or `{ success: false, error }` instead of throwing for expected failures. tRPC routers translate those into `TRPCError`s; UI code renders `result.error` inline.
- **Server-first**: link logic lives in `src/lib/api/links/*` and is shared by tRPC procedures, server actions, and the dashboard. Guards (auth, demo mode) are applied in that shared layer.
- **Self-hostable**: PostgreSQL + Docker, a one-line server install script, and clear env-driven configuration.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix UI primitives, lucide-react, zustand, nextjs-toploader |
| Language | TypeScript 5 (strict), Bun runtime |
| ORM / DB | Drizzle ORM + PostgreSQL (via `pg` / `postgres`) |
| Auth | Better Auth (sessions, API keys, admin bootstrap) |
| API | tRPC 11 (frontend + public redirect), REST route handlers (OpenAPI via JSDoc) |
| i18n | next-intl (single `en` locale) |
| Lint/Format | Biome 2.2 (formatter + linter) |
| Tests | bun test |
| State | zustand (modal store) |

---

## 3. Repo layout

```
scripts/
  install.sh             # one-line server bootstrap (curl | bash)
  bootstrap-admin.ts     # create/update admin from env
src/
  app/
    (routes)/
      (main)/            # dashboard page
      r/[r_path]/        # public redirect page (countdown -> destination)
      register/          # admin registration
      layout.tsx         # app layout (header, modal provider)
    api/
      auth/[...all]/     # Better Auth handler
      links/             # POST /api/links (create)
      links/[link]/      # PATCH + DELETE /api/links/:id
      trpc/              # tRPC HTTP handlers
    docs/                # Scalar OpenAPI reference
  components/
    modals/link-modal.tsx# create/edit modal (shows result.error inline)
    short-link.tsx       # link card
    header.tsx, dialog.tsx, button.tsx, input.tsx, field.tsx, loader.tsx
    providers/modal-provider.tsx
  config/                # locale, routes
  lib/
    actions/links.ts     # server-action re-exports for the dashboard
    api/links/           # schemas.ts, queries.ts, mutations.ts (core logic)
    auth/                # Better Auth server/client + API key auth
    db/                  # drizzle schema + migrations
    trpc/                # router + routers/{links,account,redirect}
    demo-mode.ts         # DEMO_MODE guard
  services/locale.ts
  store/use-modal-store.ts
translations/en.json
```

---

## 4. Setup

Requirements: **Bun**, Node.js 20+, **PostgreSQL**.

```bash
cp .env.example .env      # fill in values (see §5)
bun install
bun run dev               # http://localhost:2947
```

First-time steps:

```bash
bun run db:migrate        # apply schema
bun run bootstrap:admin   # create admin from ADMIN_EMAIL / ADMIN_PASSWORD
```

Or bootstrap a fresh server with one command:

```bash
curl -fsSL https://raw.githubusercontent.com/dastyare-social/DS-SH/main/scripts/install.sh | bash
```

---

## 5. Environment variables

Documented in `.env.example`. Key groups:

| Group | Variables |
|---|---|
| Database | `DATABASE_URL` |
| Admin | `ADMIN_EMAIL`, `ADMIN_PASSWORD` (used by `bootstrap:admin`) |
| API auth | `API_KEY`, `API_KEY_RATE_LIMIT_MAX_REQUESTS`, `API_KEY_RATE_LIMIT_WINDOW_MS` |
| Auth | `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` |

Conventions:

- `DEMO_MODE` (see §9) is an operator-only switch set in the server `.env`; it is **not** in `.env.example` or public docs.
- `.env` is git-ignored (`.gitignore` excludes `.env` / `.env.local`). It is loaded via `dotenv/config` imported in `src/lib/db/index.ts`.

---

## 6. Common commands

| Command | What it does |
|---|---|
| `bun run dev` | Dev server on :2947 |
| `bun run build` | `bootstrap:admin` → `next build` |
| `bun run start` | Serve production build on :2947 |
| `bun run lint` | Biome check (formatter + linter) |
| `bun run format` | Biome format --write |
| `bun run typecheck` | `tsc --noEmit` |
| `bun test` | Run unit tests |
| `bun run db:generate` | Create a migration from schema changes |
| `bun run db:migrate` | Apply migrations |
| `bun run db:push` | Push schema + seed |
| `bun run db:studio` | Drizzle Studio UI |
| `bun run db:check` | Validate schema/migrations |
| `bun run openapi:generate` | Regenerate OpenAPI spec from route JSDoc |

> The build runs `bootstrap:admin`, so it requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the environment.

---

## 7. Database

Single core table in `src/lib/db/schema/links.ts`:

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | generated 16-char id |
| `r_path` | text (unique, not null) | the short slug, e.g. `go` → `/r/go` |
| `r_to` | text (not null) | destination URL |
| `is_active` | boolean (default true) | disabled links refuse to redirect |
| `redirects` | text (default `"0"`) | string-encoded counter (incremented atomically) |
| `createdAt` / `updatedAt` | timestamps | auto-managed |

Better Auth tables (`users`, `sessions`, `accounts`, `verifications`) live alongside it. Migrations are SQL files under `src/lib/db/migrations/`.

Migration workflow:

```bash
bun run db:generate   # after editing a schema file
bun run db:migrate    # apply
```

---

## 8. Architecture & data flow

The core logic is in `src/lib/api/links/`:

- **`schemas.ts`** — zod schemas for inputs/outputs.
- **`queries.ts`** — `getLinks`, `getLinkByPath`, `getLinkById`, `getLinkStats`; return `QueryResult<T>`.
- **`mutations.ts`** — `createLink`, `updateLink`, `enableLink`, `disableLink`, `deleteLink`, `recordRedirect`; return `QueryResult`-style objects (`{ success: true, data }` / `{ success: false, error }`).

Consumers:

```
Dashboard UI ─► server actions (src/lib/actions/links.ts) ─► mutations/queries ─► Drizzle ─► Postgres
Dashboard UI ─► tRPC links.* (protected)                    ─┘
Public /r/[r_path] page ─► tRPC redirect.resolve (public) ─► recordRedirect
External clients ─► REST /api/links (Bearer API key)       ─► mutations
```

- **`src/lib/actions/links.ts`** re-exports the mutations/queries as `"use server"` functions so the dashboard can call them directly with `useTransition`.
- **`src/lib/trpc/routers/links.ts`** (`protectedProcedure`): `getAll`, `getByPath`, `create`, `update`, `delete`, `recordHit`, `stats`. Failed results become typed `TRPCError`s (e.g. `CONFLICT` for duplicate paths, `NOT_FOUND` for missing links, `FORBIDDEN` for inactive).
- **`src/lib/trpc/routers/redirect.ts`** (`publicProcedure`): `resolve` — used by the public redirect page.
- **`src/lib/trpc/routers/account.ts`**: `updateProfile` (protected).
- **REST** (`src/app/api/links/route.ts` POST, `src/app/api/links/[link]/route.ts` PATCH + DELETE): authenticated with `requireApiKeyAuth` (`Authorization: Bearer <API_KEY>`), rate-limited via `API_KEY_RATE_LIMIT_*`, and call the same mutations.

### The redirect flow

1. Visitor hits `/r/<r_path>` (`src/app/(routes)/r/[r_path]/page.tsx`).
2. The page calls `recordRedirect(r_path)` (via `src/lib/actions/links.ts` → `recordRedirect`).
3. `recordRedirect` looks up the link, rejects if missing (`Link not found.`) or disabled (`Link is inactive.`), atomically increments `redirects`, and returns `{ success: true, r_to }`.
4. The page shows a 3-second countdown, then sets `window.location.href = destination`.

Redirects intentionally remain public and **are not blocked by demo mode** — they are the core purpose of the service.

---

## 9. Demo mode

An **operator-only** switch (`DEMO_MODE=true` in the server `.env`):

- Disables **create/update/delete** for links: `createLink`, `updateLink`, `enableLink`, `disableLink`, `deleteLink` return `{ success: false, error: "Demo mode is enabled: create, update and delete operations are disabled." }`.
- `updateProfile` in the account router throws `TRPCError` with code `FORBIDDEN`.
- REST writes return `403 {"error":"Read-only demo mode is active"}`.
- **Reads, stats, and redirects keep working.**
- Enforced by `src/lib/demo-mode.ts` (`isDemoMode()` + `demoModeError`), checked at the top of each write.
- The UI is unchanged: the link modal already renders `result.error` inline, and the main page shows an error toast when a toggle fails.
- `DEMO_MODE` is deliberately not in `.env.example` or public docs.

---

## 10. Auth

- **Sessions** — Better Auth (email/password) via `/api/auth/*`; admin registration at `/register`.
- **API keys** — `src/lib/auth/api-key.ts` implements `requireApiKeyAuth`, which expects `Authorization: Bearer <API_KEY>` (not `x-api-key`). REST create/update/delete routes use it.

---

## 11. Testing & code style

```bash
bun test            # unit tests
bun run typecheck   # tsc --noEmit
bun run lint        # biome check
bun run format      # biome format --write
```

Test files: `src/lib/api/links/mutations.test.ts`, `src/lib/api/links/schemas.test.ts`, `src/lib/auth/api-key.test.ts`, `src/lib/utils.test.ts`.

Style rules (enforced by Biome, applied automatically with `bun run format`):

- **No semicolons**, 2-space indentation, trailing commas.
- Imports are auto-sorted by Biome (`organizeImports`).
- Expected failures are returned as `{ success: false, error }`, not thrown.

---

## 12. Deployment

- **Docker Compose** — the app plus a PostgreSQL service; see `README.md` / `SELF-HOSTING.md`. `docker compose up -d --build`.
- **VPS** — `scripts/install.sh` bootstraps env, DB, and services.
- **Vercel / Railway / Render** — see `SELF-HOSTING.md` for provider-specific steps.
- **Releases** — push a semantic version tag (`git tag v0.1.1 && git push origin v0.1.1`) to trigger a GitHub Release.

Production checklist: HTTPS, `BETTER_AUTH_URL` set to the public URL, `ADMIN_EMAIL`/`ADMIN_PASSWORD` bootstrapped, `API_KEY` rotated and secret.

---

## 13. Git workflow

- **Conventional commits**: `feat(scope):`, `fix(scope):`, `chore:`, etc.
- **Branching**: small self-contained fixes commit directly to `main`. Larger features get a branch (e.g. `feat/custom-slugs`) merged into `main` via PR — keeps `main` shippable and gives a review/revert checkpoint.
- Before committing: `git status`, `git diff`, `git log --oneline -10`; stage only intended files; never commit secrets (`.env`, keys).

---

## 14. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `403` on REST writes | Demo mode active, or missing/wrong `Authorization: Bearer <API_KEY>`. |
| Link modal shows an error | Check `result.error` text — e.g. `The path "/x" is already in use.` or `r_to must be a valid URL.` |
| Redirect says "Link not found" | Link deleted, or `r_path` typo. |
| Redirect says "This link is inactive" | `is_active` is false — enable it in the dashboard. |
| Build fails on `bootstrap:admin` | `ADMIN_EMAIL` / `ADMIN_PASSWORD` not set. |
| `bun run lint` errors | Run `bun run format` (Biome auto-fix) and re-check. |
