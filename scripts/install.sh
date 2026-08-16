#!/usr/bin/env bash
set -euo pipefail

REPO_URL=${1:-"https://github.com/omidshabab/sh.dastyare.social.git"}
APP_DIR=${2:-"sh.dastyare.social"}
ENV_FILE=".env"
DOCKER_COMPOSE_FILE="docker-compose.yml"

info() {
  printf '\033[1;34m%s\033[0m\n' "$*"
}

warn() {
  printf '\033[1;33m%s\033[0m\n' "$*"
}

error() {
  printf '\033[1;31m%s\033[0m\n' "$*"
  exit 1
}

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c 'import secrets; print(secrets.token_hex(32))'
  else
    date +%s | sha256sum | cut -c1-64
  fi
}

if [ ! -f package.json ] && [ ! -d .git ]; then
  if ! command -v git >/dev/null 2>&1; then
    error "git is required to clone the repository. Install git and rerun this script."
  fi
  info "Cloning repository from ${REPO_URL} into ${APP_DIR}..."
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
else
  info "Using existing repository in $(pwd)"
fi

if ! command -v docker >/dev/null 2>&1; then
  error "Docker is required for the install script. Install Docker and rerun this script."
fi

if ! command -v bun >/dev/null 2>&1; then
  info "Bun not found. Installing Bun..."
  curl -fsSL https://bun.sh/install | bash -s -- --yes
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

if [ ! -f "$ENV_FILE" ]; then
  info "Creating a local .env file with safe defaults for Docker Compose..."
  cat > "$ENV_FILE" <<EOF
DATABASE_URL="postgresql://postgres:postgres@db:5432/dastyare_social_sh"
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
API_KEY=$(generate_secret)
API_KEY_RATE_LIMIT_MAX_REQUESTS=30
API_KEY_RATE_LIMIT_WINDOW_MS=60000
BETTER_AUTH_URL="http://localhost:2947"
BETTER_AUTH_SECRET=$(generate_secret)
EOF
  warn "A .env file was created. Review and update its values before using this in production."
else
  info ".env already exists, leaving it intact."
fi

info "Bootstrapping the project with Docker Compose..."

docker compose -f "$DOCKER_COMPOSE_FILE" up -d --build

info "Installation complete."
info "Open http://localhost:2947 after Docker Compose finishes starting the services."
warn "Review .env and update secrets and the database URL before using this in production."
