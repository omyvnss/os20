#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# OS20 + Lead Engine — One-Command Install
# ============================================================================
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/omyvnss/os20/main/install.sh | bash
#   — or —
#   bash install.sh
#
# What this does:
#   1. Checks Docker is installed and running
#   2. Fetches the official deployment compose (always — never trusts stale files)
#   3. Generates local secrets
#   4. Pulls the pre-built GHCR images (no compilation)
#   5. Starts PostgreSQL, Redis, OS20 CRM + AI Lead Engine
#   6. Waits for health and prints access URLs
#
# Requirements: Docker 20.10+ (Docker Desktop or Docker Engine)
# ============================================================================

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${BLUE}[os20]${NC} $*"; }
ok()    { echo -e "${GREEN}[os20]${NC} $*"; }
warn()  { echo -e "${YELLOW}[os20]${NC} $*"; }
err()   { echo -e "${RED}[os20]${NC} $*" >&2; }

# Official release files (raw.githubusercontent = always current, no git needed)
REPO_OWNER="omyvnss"
REPO="os20"
BRANCH="main"
COMPOSE_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO}/${BRANCH}/docker-compose.yml"

REQUESTED_DIR="${OS20_DIR:-$HOME/.os20}"
RUNTIME_DIR="$REQUESTED_DIR"

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------
if ! command -v docker &>/dev/null; then
  err "Docker is not installed."
  echo "  Install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  err "Docker daemon is not running. Start Docker Desktop or run: sudo systemctl start docker"
  exit 1
fi

# Docker Compose v2 (docker compose) or v1 (docker-compose)
if docker compose version &>/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  err "Docker Compose is not available."
  echo "  Install Docker Compose: https://docs.docker.com/compose/install/"
  exit 1
fi

# ---------------------------------------------------------------------------
# Resolve the runtime directory.
# If the requested dir is a clone of the OS20 *source* repo (not a plain
# install dir), run from a dedicated directory instead so a stale/dev compose
# (e.g. `image: os20:local`) can never break the install.
# ---------------------------------------------------------------------------
if [ -d "$REQUESTED_DIR/packages" ] && [ -d "$REQUESTED_DIR/.git" ]; then
  RUNTIME_DIR="$HOME/.os20"
  warn "Found an OS20 source checkout at $REQUESTED_DIR."
  warn "Installing the app to a dedicated runtime dir: $RUNTIME_DIR"
fi

mkdir -p "$RUNTIME_DIR"
cd "$RUNTIME_DIR"

# ---------------------------------------------------------------------------
# Fetch the official compose. Always use the release copy so updates are picked
# up and local/stale environment state can't affect correctness.
# ---------------------------------------------------------------------------
log "Fetching deployment config..."
if curl -fsSL "$COMPOSE_URL" -o docker-compose.yml 2>/dev/null; then
  ok "Downloaded ${REPO_OWNER}/${REPO}:${BRANCH} compose"
else
  warn "Direct download failed — falling back to a shallow git clone..."
  if ! command -v git &>/dev/null; then
    err "Neither curl nor git is available to fetch the compose file."
    exit 1
  fi
  TMP_CLONE="$(mktemp -d)"
  trap 'rm -rf "$TMP_CLONE"' EXIT
  git clone --depth 1 --branch "$BRANCH" \
    "https://github.com/${REPO_OWNER}/${REPO}.git" "$TMP_CLONE" >/dev/null 2>&1
  cp "$TMP_CLONE/docker-compose.yml" docker-compose.yml
  ok "Cloned ${REPO_OWNER}/${REPO}:${BRANCH} compose"
fi

# Sanity check: the official compose MUST reference our pre-built GHCR images.
if ! grep -q 'ghcr.io/omyvnss' docker-compose.yml; then
  err "Fetched compose does not reference the official GHCR images. Aborting."
  err "This can happen if the script is out of date — re-run the installer."
  exit 1
fi

# ---------------------------------------------------------------------------
# Generate local secrets (only on first install; keep user's existing .env)
# ---------------------------------------------------------------------------
ENV_FILE="$RUNTIME_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  log "Generating secrets..."
  cat > "$ENV_FILE" <<EOF
APP_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
PGDB_ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
OS20_LEADGEN_TOKEN=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
EOF
  ok "Secrets generated → $ENV_FILE"
fi

# ---------------------------------------------------------------------------
# Pull images + start services
# ---------------------------------------------------------------------------
log "Pulling pre-built images from GHCR..."
$COMPOSE pull 2>/dev/null || {
  err "Failed to pull images. Check your network / Docker login state."
  err "Images are public — you should NOT need to log in to ghcr.io."
  exit 1
}

log "Starting OS20 + Lead Engine..."
$COMPOSE up -d --remove-orphans

# ---------------------------------------------------------------------------
# Wait for health
# ---------------------------------------------------------------------------
log "Waiting for services to become healthy..."
TRIES=0
MAX_TRIES=90
while [ $TRIES -lt $MAX_TRIES ]; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/healthz 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    break
  fi
  sleep 4
  TRIES=$((TRIES + 1))
  if [ $((TRIES % 10)) -eq 0 ]; then
    log "Still starting... ($TRIES/${MAX_TRIES})"
  fi
done

if [ "$TRIES" -ge "$MAX_TRIES" ]; then
  warn "Server hasn't fully started yet. It may need a few more minutes on first boot."
  warn "Check status: $COMPOSE logs -f os20"
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
ok "============================================"
ok "  OS20 + AI Lead Engine is running!"
ok "============================================"
echo ""
ok "  CRM Dashboard:  http://localhost:3010"
ok "  Lead Engine:     http://localhost:8120/health"
ok "  Auth:            SKIP_AUTH=true (local mode)"
echo ""
ok "  To set up BYOK AI scoring:"
ok "    1. Go to http://localhost:3010"
ok "    2. Settings → AI Provider → Add OpenRouter or OpenAI key"
ok "    3. Lead scoring + extraction will use your key automatically"
echo ""
ok "  Useful commands (run in $RUNTIME_DIR):"
ok "    $COMPOSE logs -f          # follow logs"
ok "    $COMPOSE down             # stop everything"
ok "    $COMPOSE down -v          # stop + delete data"
ok "    $COMPOSE restart          # restart all services"
ok "    npx os20-cli status       # or use the CLI from anywhere"
echo ""
ok "  Data lives in Docker volumes (persistent)."
ok "  Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0)."
echo ""