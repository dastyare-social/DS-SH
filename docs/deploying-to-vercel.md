# Deploying to Vercel — Dastyare Social SH

> This guide walks through deploying Dastyare Social SH to Vercel as a Docker container.
> Vercel runs the prebuilt Docker Hub image `dastyaresocial/ds-sh`, referenced by a pull-only
> `Dockerfile.vercel`, on Fluid compute; PostgreSQL and secrets stay external.

---

## Table of Contents

1. [Overview](#overview)
2. [How the Vercel Image Works](#how-the-vercel-image-works)
3. [Prerequisites](#prerequisites)
4. [Provision External Resources](#provision-external-resources)
5. [Environment Variables](#environment-variables)
6. [One-Off Database Setup](#one-off-database-setup)
7. [Deploy to Vercel](#deploy-to-vercel)
8. [Post-Deployment Checks](#post-deployment-checks)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Dastyare Social SH is a Next.js 16 (App Router) application. Vercel does **not** build the app
from this repository — it runs a prebuilt image pushed to Docker Hub (`dastyaresocial/ds-sh`,
the same image used by the Docker Compose self-host stack). The `Dockerfile.vercel` at the
repository root is a pull-only blueprint: it references that image and adds the runtime entry
point Vercel needs. The database is **not** bundled into the image — you provision it yourself,
and the app talks to it at runtime.

This results in a deployment where:

- Vercel pulls the prebuilt image and starts the Next.js server on **Fluid Compute**.
- The container listens on the `PORT` variable Vercel injects (the pull-only `Dockerfile`
  overrides the image's default `2947` port so the Vercel health check passes on `$PORT`,
  default 80).
- The one-off database migration and admin bootstrap run locally (or in CI) against production
  variables pulled from Vercel — never on the server and never during any image build.
- Shipping new code means re-pushing the Docker Hub image, then redeploying; a Vercel redeploy
  alone only picks up code that is already in the image.

If you prefer to run the app yourself instead, see the [Self-hosting guide](../SELF-HOSTING.md).

## How the Vercel Image Works

- Vercel looks for `Dockerfile.vercel` at the repository root and uses it as the container
  image definition. It is **pull-only** — there is no build stage, so Vercel never compiles
  the app, installs dependencies, or runs `next build`.
- The full multi-stage `Dockerfile` in this repo (Builder `node:20-bookworm` + Bun `v1.3.14`,
  runs `next build`; Runtime `node:20-slim` copies `.next`, `public`, `package.json`,
  `node_modules`, and sources) is the **source** of the image. It is built and pushed to
  Docker Hub from your machine or CI, and is **not** used by Vercel directly.
- `Dockerfile.vercel` contains only:

  ```dockerfile
  FROM dastyaresocial/ds-sh:latest
  EXPOSE 80
  WORKDIR /app
  CMD ["sh", "-c", "node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-80}"]
  ```

- The stored image defaults to `next start -p 2947` (the self-host port). Vercel Fluid
  injects `PORT` (default 80) and health-checks the container, so the `CMD` override binds to
  `0.0.0.0:${PORT:-80}` to satisfy it.
- `latest` is used by default. Pin a specific tag (e.g. `FROM dastyaresocial/ds-sh:0.1.0`)
  in this file if you want reproducible, tag-pinned deployments.

## Prerequisites

- A **Vercel** account and the project created in the dashboard (or `npx vercel link`).
- **Node.js 20+** (or Bun) and the Vercel CLI installed locally — Node is needed for the
  one-off database setup, not for building anything:
  ```bash
  npm install -g vercel
  ```
- The `dastyaresocial/ds-sh` image pushed to Docker Hub. Build and push it from a checkout of
  this repository (`docker build -t dastyaresocial/ds-sh:latest . && docker push
  dastyaresocial/ds-sh:latest`), let the `docker-publish.yml` workflow do it, or point
  `Dockerfile.vercel` at whatever image you use.
- An **external PostgreSQL** database (with TLS) that the app can reach at runtime — e.g. Neon,
  Supabase, or Railway. This replaces the Postgres bundled in the self-host compose stack.
- A **domain** pointed at Vercel to serve redirects over HTTPS and to power the dashboard.

## Provision External Resources

Create these before deploying. None of them are created by Vercel.

### PostgreSQL

Create a database and note its connection string. Prefer a `postgresql://...` URL that works
over TLS (most managed providers give you one). You will set this as `DATABASE_URL`.

### Secrets

Generate two random secrets, each unique:

```bash
openssl rand -hex 32
```

Use one value for `API_KEY` and a different one for `BETTER_AUTH_SECRET`.

> **Warning:** never commit `.env`, `.env.local`, or `npx vercel env pull` output — the app and
> tooling load `.env` from the working directory, but the file must stay secret and local.

## Environment Variables

There are two very different classes of variables here:

- **Runtime variables** — read from the process environment at runtime. These are set per
  environment in Vercel (or pulled locally for the one-off setup) and take effect on deploys
  without rebuilding the image.
- **`NEXT_PUBLIC_*` variables** — inlined into the client bundle when the Docker Hub image is
  built. On a pull-only deployment **Vercel-environment values for these are ignored**; to
  change one you must rebuild and re-push the image, then redeploy.

Dastyare Social SH has no `NEXT_PUBLIC_*` variables today, so every variable below is a
**runtime** variable.

| Variable | Where it matters | Purpose | Example / notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | runtime (Vercel) | Postgres connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `ADMIN_EMAIL` | runtime (Vercel/local) | Bootstrap admin account | Your email |
| `ADMIN_PASSWORD` | runtime (Vercel/local) | Bootstrap admin password | Generate a strong one |
| `API_KEY` | runtime (Vercel) | API auth for `/api/*` | `openssl rand -hex 32` |
| `API_KEY_RATE_LIMIT_MAX_REQUESTS` | runtime (Vercel) | API rate limit | `30` |
| `API_KEY_RATE_LIMIT_WINDOW_MS` | runtime (Vercel) | API rate limit window | `60000` |
| `BETTER_AUTH_URL` | runtime (Vercel) | Auth base URL | `https://your-domain.com` (your prod domain) |
| `BETTER_AUTH_SECRET` | runtime (Vercel) | Auth signing secret | `openssl rand -hex 32` |

Set every variable above in the **Production** environment in Vercel. Rebuild and re-push the
image before removing any `NEXT_PUBLIC_*` value if one is ever added back.

## One-Off Database Setup

Migrations and the admin bootstrap run against your production database **once**, from your
machine. They never run on the server and never during any image build.

```bash
npx vercel login
npx vercel link
npx vercel env pull .env --environment=production
bun run db:migrate
bun run bootstrap:admin
rm .env
```

Why this works:

- `src/lib/db/migrate.ts` and `scripts/bootstrap-admin.ts` load `dotenv/config`, so both read
  the pulled `.env` from the current directory.
- `npx vercel env pull` writes the production variables into `.env`.
- Delete `.env` when done so it never gets committed.

`bootstrap:admin` creates the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. If you later
reset the database, re-run these two commands.

## Deploy to Vercel

1. **Link the project:**
   ```bash
   npx vercel login
   npx vercel link
   ```
2. **Add environment variables** (Production) — either in the dashboard (Settings → Environment
   Variables) or with the CLI:
   ```bash
   npx vercel env add DATABASE_URL production
   npx vercel env add BETTER_AUTH_URL production
   # ... repeat for every runtime variable in the table above
   ```
3. **Push the image** (only when the app code changed, so the image carries the new build):
   ```bash
   docker build -t dastyaresocial/ds-sh:latest .
   docker push dastyaresocial/ds-sh:latest
   ```
4. **Deploy:**
   ```bash
   npx vercel --prod
   ```
   Vercel detects `Dockerfile.vercel`, pulls the prebuilt `dastyaresocial/ds-sh` image from
   Docker Hub, and starts the server on Fluid compute.

   If you connect the repo to a Git integration, every push to the production branch triggers a
   new deployment automatically — but code changes only appear after step 3 re-pushed the image.

There is no build step, so deployments are fast: Vercel pulls the image and boots it. A redeploy
only ships new code if the Docker Hub image was re-pushed first.

## Post-Deployment Checks

After the deployment is ready, verify each of these:

- Open `/docs` — the API playground loads and lists routes.
- Open `/openapi.json` — the OpenAPI document renders.
- Open `/` — the landing page loads.
- Log in as the admin user created by `bootstrap:admin`.
- Create a short link and confirm its `/r/...` redirect works.
- Check the runtime: server listens on Vercel-injected `PORT` (default 80) — no container
  changes needed.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Deployment fails | Vercel doesn't build, so failures are almost always image pulls (Docker Hub is unreachable, the tag doesn't exist, or the image is private) or runtime env misconfiguration. Check the deployment logs. |
| Redeploy doesn't show my latest code | The code was never built into the image. Rebuild and re-push `dastyaresocial/ds-sh` (step 3 in [Deploy to Vercel](#deploy-to-vercel)), then redeploy. A Vercel redeploy alone re-runs the same pulled image. |
| 504 / very slow first request | Cold start on Fluid compute. Keep the runtime lean and warm up the deployed URL. |
| Vercel uses framework build instead of Dockerfile | The project preset may say Next.js (from `.vercel/project.json`). In project Settings → Build, ensure the deployment uses `Dockerfile.vercel` (e.g. preset "Other" / container-image import) and redeploy. |
| `PORT`/`2947` confusion | Vercel injects `PORT`; the pull-only `Dockerfile.vercel` `CMD` binds to it (falling back to `80`). The self-host-only `2947` default in the stored image is used when no `PORT` is injected. No action needed. |

---

*Last updated: September 2026*