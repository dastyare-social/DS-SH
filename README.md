# Dastyare Social — SH

[![Deploy](https://img.shields.io/badge/deploy-Docker%20%7C%20Bun-lightgrey)](https://github.com/omidshabab/sh.dastyare.social)
[![Stars](https://img.shields.io/github/stars/omidshabab/sh.dastyare.social)](https://github.com/omidshabab/sh.dastyare.social/stargazers)
[![Forks](https://img.shields.io/github/forks/omidshabab/sh.dastyare.social)](https://github.com/omidshabab/sh.dastyare.social/network/members)

## Why this project

Dastyare Social SH is a production-ready short-link service built around:

- a clean, modern short-link dashboard with redirects and activity tracking
- a modern REST API with OpenAPI docs (`/docs`)
- Better Auth integration for sessions, API keys, and admin bootstrap
- internationalization via next-intl and a fast developer workflow with Bun and Drizzle

## Popularity & growth

- clear deployment and self-hosting documentation
- a fast developer workflow with Bun and Drizzle migrations
- a growing open-source mindset for maintainability and QA

## Quick start

**Requirements:** Bun, Node.js 20+, and PostgreSQL.

### Local quick start

```bash
cp .env.example .env
bun install
bun run dev          # http://localhost:2947
```

### One-command server install

Use the install script to bootstrap the repository on a fresh server or VPS.
```bash
curl -fsSL https://raw.githubusercontent.com/omidshabab/sh.dastyare.social/main/scripts/install.sh | bash
```
> The script creates a default `.env`, builds Docker Compose services, and starts the app.

On first build, migrations run automatically and an admin user is bootstrapped from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Environment variables

Copy `.env.example` to `.env` and fill the values before running the app. Do not commit `.env` to source control.

### Core environment variables

- `DATABASE_URL`
  - PostgreSQL connection string.
  - Example: `postgresql://sh_user:strong-password@127.0.0.1:5432/dastyare_social_sh`
  - For hosted providers, use the URL supplied by the provider.
- `ADMIN_EMAIL`
  - Administrator email used by bootstrap and admin sign-in.
- `ADMIN_PASSWORD`
  - Bootstrap admin password. Use a strong password or secret passphrase.
- `API_KEY`
  - Shared API key for protected REST routes.
  - Generate with `openssl rand -hex 32` or a secure secret generator.
- `API_KEY_RATE_LIMIT_MAX_REQUESTS`
  - Max requests allowed per window for API key clients.
- `API_KEY_RATE_LIMIT_WINDOW_MS`
  - Window size in milliseconds for API key rate limiting.
- `BETTER_AUTH_URL`
  - Public base URL where the app is served.
  - Example: `https://app.example.com`
- `BETTER_AUTH_SECRET`
  - Long random secret for Better Auth session signing.
  - Generate with `openssl rand -base64 32`.

### How to fill these values

- Use your provider dashboard for `DATABASE_URL` and `BETTER_AUTH_URL`.
- Generate strong secrets with `openssl rand -hex 32`, `openssl rand -base64 32`, or a secure password manager.
- For `BETTER_AUTH_URL`, use the site URL that will be available in production.
- AI can help draft example configs and shell commands, but never store or commit actual secret values.

## Pages

Dastyare Social SH includes these pages:

- `/` — short-link dashboard: create, edit, enable/disable, and track links
- `/register` — sign up / sign in
- `/r/[r_path]` — public redirect page with a countdown before leaving
- `/docs` — interactive API docs (Scalar)

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (port 2947) |
| `bun run build` | Bootstrap admin + production build |
| `bun run start` | Start production server |
| `bun run lint` | Biome check |
| `bun run format` | Biome format |
| `bun run bootstrap:admin` | Create or update admin user from env |
| `bun run db:generate` | Generate migration from schema changes |
| `bun run db:migrate` | Run Drizzle migrations |
| `bun run db:drop` | Drop the database |
| `bun run db:pull` | Introspect the database |
| `bun run db:push` | Push schema + seed |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run db:check` | Drizzle-kit check |
| `bun run openapi:generate` | Regenerate `public/openapi.json` from route JSDoc |

## Docker Compose

### Production

```bash
docker compose up -d --build
```

The default `docker-compose.yml` includes services for:

- `app` — the Next.js app
- `db` — PostgreSQL

### Development

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

The `docker-compose.dev.yml` file mounts the repository into the container and runs the dev server.

## Architecture

```
src/
├── app/
│   ├── (routes)/
│   │   ├── (main)/           # Dashboard page
│   │   ├── r/[r_path]/       # Public redirect page
│   │   └── register/         # Auth pages
│   ├── api/
│   │   ├── links/            # REST API (OpenAPI-documented)
│   │   ├── auth/             # Better Auth handler
│   │   └── trpc/             # Internal tRPC (used by frontend)
│   └── docs/                 # Scalar API reference UI
├── components/               # React UI components
├── lib/
│   ├── actions/              # Server actions (links)
│   ├── api/                  # Business logic
│   ├── auth/                 # Better Auth server + client + API key auth
│   ├── db/                   # Drizzle schema + migrations
│   ├── trpc/                 # tRPC router (frontend data layer)
│   └── services/             # Shared services
├── store/                    # Zustand stores
└── styles/                   # Global styles
```

**Stack:** Next.js 16 · React 19 · Bun · PostgreSQL · Drizzle ORM · Better Auth · tRPC · Tailwind CSS 4 · next-intl · Zustand

## API documentation

| Resource | URL |
|----------|-----|
| Interactive docs (Scalar) | `/docs` |
| OpenAPI spec (JSON) | `/openapi.json` |

Base URL for REST endpoints: `{APP_URL}/api`

All REST routes are protected with the shared API key (`Authorization: Bearer <API_KEY>`):

- `GET /api/links` — list all short links
- `POST /api/links` — create a short link (`{ r_to, r_path? }`)
- `GET /api/links/{id|r_path}` — get a link by ID or slug
- `PATCH /api/links/{id|r_path}` — update `r_to` and/or `is_active`
- `DELETE /api/links/{id|r_path}` — delete a link

## Configuration

- **Environment:** Copy `.env.example` — never commit secrets
- **Port:** Default `2947` (set in `package.json` scripts)

## Deployment

For a complete self-hosting guide covering environment variables, PostgreSQL, Docker, VPS, Vercel, Railway, and Render, see [SELF-HOSTING.md](./SELF-HOSTING.md).

## Releases

Push a version tag to publish a GitHub Release with automatically generated
release notes:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Use semantic versions: patch releases for fixes (`v0.1.1`), minor releases for
new features (`v0.2.0`), and major releases for breaking changes (`v1.0.0`).

Docker multi-stage build included. See `Dockerfile`. Production build skips DB migration at image build time; run migrations at container start or via CI.
