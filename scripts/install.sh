#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${1:-"."}
ENV_FILE=".env"
DOCKER_COMPOSE_FILE="docker-compose.yml"
DOCKER_COMPOSE_DEV_FILE="docker-compose.dev.yml"
DOCKER_COMPOSE_URL="https://raw.githubusercontent.com/dastyare-social/DS-SH/main/docker-compose.yml"
DOCKER_COMPOSE_DEV_URL="https://raw.githubusercontent.com/dastyare-social/DS-SH/main/docker-compose.dev.yml"
BASE_URL="https://raw.githubusercontent.com/dastyare-social/DS-SH/main"

# Both compose files are dropped into the project so you can run the prebuilt
# image in production (docker-compose.yml) or in dev mode with live code
# mounting (docker-compose.dev.yml).
DOCKER_COMPOSE_FILES=(
  "docker-compose.yml"
  "docker-compose.dev.yml"
)
# A pull-only Vercel blueprint (FROM dastyaresocial/ds-sh:latest + PORT-aware
# CMD) dropped at the project root so the installed folder can be deployed to
# Vercel Fluid compute without touching the app source repo.
VERCEL_FILES=(
  "Dockerfile.vercel"
)

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
    error "Either openssl or python3 is required to generate secrets."
  fi
}

if ! command -v docker >/dev/null 2>&1; then
  error "Docker is required for the install script. Install Docker and rerun this script."
fi

if ! command -v curl >/dev/null 2>&1; then
  error "curl is required for the install script. Install curl and rerun this script."
fi

if [ "$APP_DIR" != "." ]; then
  mkdir -p "$APP_DIR"
  cd "$APP_DIR"
fi

for COMPOSE_FILE in "${DOCKER_COMPOSE_FILES[@]}"; do
  if [ -f "$COMPOSE_FILE" ]; then
    info "$COMPOSE_FILE already exists, leaving it intact."
  else
    URL_FOR_FILE="$BASE_URL/$COMPOSE_FILE"
    info "Downloading $COMPOSE_FILE..."
    curl -fsSL "$URL_FOR_FILE" -o "$COMPOSE_FILE"
  fi
done

# Interactive answers come from the controlling terminal: under `curl ... | bash`
# the script's stdin is the download pipe (already at EOF), so a plain `read`
# would see an empty value. Prefer /dev/tty when one is attached, else stdin.
# The password is hidden with `stty -echo` rather than `read -s` because macOS
# ships bash 3.2, where `read -s -p` fails to disable echo (the password would
# be printed in plain text as it is typed).
restore_echo() {
  stty echo < /dev/tty 2>/dev/null || true
  stty echo 2>/dev/null || true
}

if [ ! -f "$ENV_FILE" ]; then
  printf '\033[1;36m--- Dastyare Social — SH — INSTALLER ---\033[0m\n'
  # /dev/tty can report readable (-r) even when no controlling terminal is
  # attached (e.g. a non-interactive agent shell), which makes reads fail. Probe
  # with a write too, so a phantom tty falls through to the stdin branch below.
  if [ -r /dev/tty ] && printf '' > /dev/tty 2>/dev/null; then
    trap restore_echo EXIT INT TERM
    printf '%s' "Email:    "
    read -r ADMIN_EMAIL < /dev/tty || true
    stty -echo < /dev/tty
    printf '%s' "Password: "
    read -r ADMIN_PASSWORD < /dev/tty || true
    printf '\n'
    stty echo < /dev/tty
  elif [ -t 0 ]; then
    printf '%s' "Email:    "
    read -r ADMIN_EMAIL || true
    stty -echo
    printf '%s' "Password: "
    read -r ADMIN_PASSWORD || true
    printf '\n'
    stty echo
  else
    printf '%s' "Email:    "
    read -r ADMIN_EMAIL || true
    printf '%s' "Password: "
    read -r ADMIN_PASSWORD || true
    printf '\n'
  fi

  if [ -z "$ADMIN_EMAIL" ]; then
    error "Email cannot be empty."
  fi

  if [ -z "$ADMIN_PASSWORD" ]; then
    error "Password cannot be empty."
  fi

  info "Creating .env..."
  cat > "$ENV_FILE" <<EOF
DATABASE_URL="postgresql://postgres:postgres@db:5432/dastyare_social_sh"
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
API_KEY=$(generate_secret)
API_KEY_RATE_LIMIT_MAX_REQUESTS=30
API_KEY_RATE_LIMIT_WINDOW_MS=60000
BETTER_AUTH_URL="http://localhost:2947"
BETTER_AUTH_SECRET=$(generate_secret)
EOF
  warn "A .env file was created with your credentials and auto-generated secrets."
else
  info ".env already exists, leaving it intact."
fi

# Protect the freshly written .env from ever being committed. The installer can
# run into any directory (a git repo, a future repo, or plain disk), so we make
# sure a .gitignore exists that keeps secrets, local state, and editor/Vercel
# artifacts out of git — without clobbering a .gitignore the user already has.
if [ ! -f ".gitignore" ]; then
  info "Creating .gitignore to keep .env and local state out of git..."
  cat > ".gitignore" <<'GITIGNORE'
# Environment secrets and local state
.env
.env.*
!.env.example

# Node
node_modules/
.next/

# Vercel
.vercel/

# OS / editor
.DS_Store
*.pem

# Local docker compose overrides (machine-specific)
docker-compose.override.yml
GITIGNORE
else
  info ".gitignore already exists, leaving it intact."
fi

for FILE in "${VERCEL_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    info "$FILE already exists, leaving it intact."
  else
    info "Downloading $FILE (use it to deploy this folder to Vercel Fluid compute)..."
    mkdir -p "$(dirname "$FILE")"
    curl -fsSL "$BASE_URL/$FILE" -o "$FILE"
  fi
done

info "Starting the app with Docker Compose (pulls the latest prebuilt dastyaresocial/ds-sh image)..."
info "The compose project is pinned to \"dastyare_social_sh\", so containers/volumes are prefixed dastyare_social_sh- regardless of the install directory."
docker compose -f "$DOCKER_COMPOSE_FILE" pull
docker compose -f "$DOCKER_COMPOSE_FILE" up -d

info "Installation complete."
info "Open http://localhost:2947 after Docker Compose finishes starting the services."
info "For development with live code mounting, run: docker compose -f docker-compose.dev.yml up -d"
warn "Review .env and update secrets before using this in production."
