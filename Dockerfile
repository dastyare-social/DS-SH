# Multi-stage Dockerfile
# Build stage uses Bun to run TypeScript helpers and install dependencies
FROM node:20-bullseye AS builder

WORKDIR /app

# Install curl + unzip for bun installer
RUN apt-get update && apt-get install -y curl ca-certificates unzip --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.14"
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Copy project manifest and lockfile, install dependencies with bun
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build Next.js. Skip DB migrations at image build time — they run at container
# start via docker-compose (db:migrate + bootstrap:admin + start).
RUN bunx next build

## Production image
FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production

# Install curl + unzip and Bun for runtime helper scripts (db:migrate, bootstrap:admin)
RUN apt-get update && apt-get install -y curl ca-certificates unzip --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.14"
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Copy built app, source for runtime scripts, and installed deps from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/translations ./translations
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/README.md ./README.md
COPY --from=builder /app/.env.example ./.env.example

EXPOSE 2947

# Start the Next.js app
CMD ["sh", "-c", "bun run start"]
