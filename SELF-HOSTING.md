# Self-hosting guide

This document covers how to self-host Dastyare Social — SH from scratch on common platforms such as Vercel, VPS, Docker, Railway, Render, and similar services.

## 1) What you need before deployment

You need three core services:

1. A PostgreSQL database
2. A domain with HTTPS
3. A server or platform to run the Next.js app

## 2) Required environment variables

Copy [.env.example](./.env.example) to `.env` and fill the values.

```dotenv
DATABASE_URL="postgresql://user:password@host:5432/db"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="strong-password"
API_KEY="your-api-key"
API_KEY_RATE_LIMIT_MAX_REQUESTS=30
API_KEY_RATE_LIMIT_WINDOW_MS=60000
BETTER_AUTH_URL="https://your-domain.com"
BETTER_AUTH_SECRET="long-random-secret"
```

### Recommended values

- `BETTER_AUTH_SECRET` should be a long random string.
- `API_KEY` should be a strong secret used for protected API routes.

### How to generate or obtain every required value

- `DATABASE_URL`: Copy the full connection URL from your PostgreSQL provider, or build it from `host`, `port`, `user`, `password`, and `database`.
  - Example local value: `postgresql://sh_user:strong-password@127.0.0.1:5432/dastyare_social_sh`
  - Example managed provider value: `postgresql://username:password@db.example.com:5432/db?sslmode=require`
- `ADMIN_EMAIL`: Use a valid email address for the bootstrap admin user.
- `ADMIN_PASSWORD`: Choose a strong password, or generate one with a password manager.
- `API_KEY`: Generate a secure API key with `openssl rand -hex 32`, `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`, or a trusted secret manager.
- `API_KEY_RATE_LIMIT_MAX_REQUESTS`: Set the number of requests allowed per window for API key clients.
- `API_KEY_RATE_LIMIT_WINDOW_MS`: Set the rate limit window in milliseconds. Example: `60000` for one minute.
- `BETTER_AUTH_URL`: Set to the same public domain that users will access.
- `BETTER_AUTH_SECRET`: Generate a random secret string with `openssl rand -base64 32`.

### If you use AI to help fill env values

AI can help you generate example values and shell commands, but do not ask any AI to store or keep your real production secrets. Always verify the output and keep actual secrets only in `.env` or your deployment vault.

## 3) Database setup

### Option A: Neon / Supabase Postgres / managed PostgreSQL

Use any PostgreSQL 14+ compatible provider.

Example:

```dotenv
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
```

After the database is ready, run:

```bash
bun run db:migrate
bun run bootstrap:admin
```

### Option B: Self-hosted PostgreSQL on a VPS

Install PostgreSQL and create a database:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
```

Inside PostgreSQL:

```sql
CREATE DATABASE dastyare_social_sh;
CREATE USER sh_user WITH PASSWORD 'strong-password';
ALTER ROLE sh_user WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE dastyare_social_sh TO sh_user;
```

Then set:

```dotenv
DATABASE_URL="postgresql://sh_user:strong-password@127.0.0.1:5432/dastyare_social_sh"
```

## 4) Build and run locally

```bash
bun install
bun run dev
```

The app runs on port `2947` by default.

## 5) Production build

```bash
bun run build
```

For production, run migrations before starting the app:

```bash
bun run db:migrate
bun run start
```

## 6) One-command server install

Use the install script to bootstrap the repository on a fresh server or VPS.

```bash
curl -fsSL https://raw.githubusercontent.com/dastyare-social/DS-SH/main/scripts/install.sh | bash
```

The script will:

- clone the repository if needed
- install Bun if it is missing
- create `.env` with default local values
- build and start Docker Compose services

> Review and update the generated `.env` before using this setup in production.

## 7) Docker deployment

### Pull from Docker Hub

```bash
docker pull dastyaresocial/ds-sh:latest
docker run -p 2947:2947 --env-file .env dastyaresocial/ds-sh:latest
```

### Build locally

```bash
docker build -t ds-sh .
docker run -p 2947:2947 --env-file .env ds-sh
```

### Production Docker Compose

Use the production compose file to run the app with PostgreSQL.

```bash
docker compose up -d --build
```

### Development Docker Compose

Use the development compose file to run the app in dev mode with live code mounting.

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

## 8) Deploy on a VPS

### Example with Docker Compose

Use the included Dockerfile and a compose file such as:

```yaml
services:
  app:
    image: dastyaresocial/ds-sh:latest
    ports:
      - "2947:2947"
    env_file:
      - .env
    restart: always
```

Then:

```bash
docker compose up -d
```

### Reverse proxy

If you run behind Nginx or Caddy, make sure the app is reachable over HTTPS and forward traffic to port `2947`.

## 9) Deploy on Vercel

Vercel can host the frontend, but this project also depends on PostgreSQL, so you should treat that as an external service.

### Vercel setup

1. Import the GitHub repository in Vercel.
2. Set the environment variables from the `.env` file.
3. Make sure `BETTER_AUTH_URL` uses your Vercel domain.
4. Add a PostgreSQL provider.
5. Run migrations as a build or post-deploy step.

### GitHub Actions deployment

If you use the repository's Vercel deployment workflow, add these **repository
secrets** in GitHub under **Settings → Secrets and variables → Actions**:

- `VERCEL_TOKEN`: a Vercel access token created in your Vercel account settings.
- `VERCEL_ORG_ID`: the Vercel team or personal-account ID for the project.
- `VERCEL_PROJECT_ID`: the ID of the Vercel project.

The last two values are available in Vercel under the project's settings, or in
the `.vercel/project.json` file created by `vercel link`. Do not commit that
file or any token. The workflow stops with a clear message when a required
secret is absent; secrets are not provided to pull requests from forks.

### Important note

Because the app uses server-side runtime and database access, Vercel is suitable for the app shell but you still need a real database backing service.

## 10) Deploy on Railway

1. Create a new Railway project.
2. Connect the GitHub repo.
3. Add a PostgreSQL service.
4. Add the app service and set the environment variables.
5. Set the start command to:

```bash
bun run db:migrate && bun run start
```

## 11) Deploy on Render

1. Create a new Web Service from the GitHub repo.
2. Choose the Dockerfile or a Node environment.
3. Add the environment variables.
4. Set the start command:

```bash
bun run db:migrate && bun run start
```

## 12) Deploy on a PaaS with Docker support

Platforms such as Fly.io, CapRover, and similar services can work if they support Docker or a Node runtime and allow custom environment variables.

## 13) Production checklist

- Set all required environment variables
- Create a PostgreSQL database and run migrations
- Make sure the app is served over HTTPS
- Set the admin bootstrap credentials
- Test creating a short link after deployment
- Check `/docs` and `/openapi.json` after the first startup

## 14) Recommended provider examples

- Neon / Supabase Postgres
- Railway Postgres
- VPS + PostgreSQL
- Render Postgres
