# Contributing

Guide for humans and AI agents working on Dastyare Social — SH.

## Setup

1. Clone the repo and install dependencies: `bun install`
2. Copy `.env.example` to `.env` and fill in all values
3. Start PostgreSQL and set `DATABASE_URL`
4. Run `bun run db:migrate` to apply migrations
5. Run `bun run dev` — the app runs at `http://localhost:2947`

## Development workflow

1. Edit Drizzle schemas in `src/lib/db/schema/` → `bun run db:generate` → review migration → `bun run db:migrate`
2. Add or change business logic in `src/lib/api/` first, then wire in `src/lib/actions/` or `src/app/api/*/route.ts`
3. Add JSDoc `@openapi` annotations to route handlers when changing the REST API surface
4. Regenerate OpenAPI: `bun run openapi:generate`
5. Lint: `bun run lint` · Typecheck: `bun run typecheck` · Tests: `bun run test`

## API documentation workflow

This project uses [next-openapi-gen](https://github.com/tazo90/next-openapi-gen). Route handlers are the source of truth.

Example annotation:

```typescript
/**
 * List links
 * @description Returns every short link ordered by creation date.
 * @tag Links
 * @openapi
 */
export async function GET(req: NextRequest) { ... }
```

After editing annotations or route signatures:

```bash
bun run openapi:generate
```

Commit both the route changes and the regenerated `public/openapi.json`.

## Code conventions

- **Minimal diffs:** Change only what the task requires
- **Business logic:** Lives in `src/lib/api/`, not route files
- **Validation:** Use Zod schemas in `src/lib/api/links/schemas.ts` (exported via drizzle-zod / `zod`)
- **Imports:** Use `@/` path alias
- **Components:** Functional React, Tailwind CSS 4, match existing component style
- **Result types:** Query/mutation helpers return discriminated unions (`{ success: true; data } | { success: false; error }`) so callers can narrow without non-null assertions
- **No secrets:** Never commit `.env`, credentials, or API keys

## File ownership

| Area | Location |
|------|----------|
| REST routes | `src/app/api/` |
| API logic | `src/lib/api/links/` |
| Server actions | `src/lib/actions/` |
| Database | `src/lib/db/schema/`, `src/lib/db/migrations/` |
| Auth | `src/lib/auth/` |
| Frontend pages | `src/app/(routes)/` |
| UI components | `src/components/` |
| tRPC routers | `src/lib/trpc/` |
| OpenAPI output | `public/openapi.json` (generated) |

## Pull request checklist

- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes
- [ ] API changes include JSDoc annotations and regenerated OpenAPI
- [ ] Schema changes include a Drizzle migration
- [ ] No secrets or `.env` files in the diff

## AI agent notes

- Read [README.md](./README.md) for architecture overview
- Prefer REST API docs at `/docs` and `/openapi.json` for integration work
- Do not refactor unrelated code or introduce new abstractions without request
