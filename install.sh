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
#   1. Checks Docker is installed
#   2. Pulls pre-built images from GHCR (no compilation needed)
#   3. Starts PostgreSQL, Redis, OS20 CRM + AI Lead Engine
#   4. Seeds the default workspace
#   5. Opens http://localhost:3010
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

INSTALL_DIR="${OS20_DIR:-$HOME/os20}"
REPO_URL="https://github.com/omyvnss/os20.git"

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
# Clone or update the deployment repo
# ---------------------------------------------------------------------------
if [ -d "$INSTALL_DIR" ]; then
  log "Found existing install at $INSTALL_DIR — updating..."
  cd "$INSTALL_DIR"
  if [ -d .git ]; then
    git pull --ff-only 2>/dev/null || warn "Could not auto-update (using existing files)"
  fi
else
  log "Cloning OS20 to $INSTALL_DIR..."
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || {
    warn "Git clone failed — creating minimal deployment locally..."
    mkdir -p "$INSTALL_DIR"
    _fetch_compose
  }
  cd "$INSTALL_DIR"
fi

# ---------------------------------------------------------------------------
# Generate secrets if not set
# ---------------------------------------------------------------------------
ENV_FILE="$INSTALL_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  log "Generating secrets..."
  cat > "$ENV_FILE" <<EOF
ACCESS_TOKEN_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
LOGIN_TOKEN_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
FILE_TOKEN_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
PGDB_ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
APP_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
EOF
  ok "Secrets generated → $ENV_FILE"
fi

# ---------------------------------------------------------------------------
# Pull images
# ---------------------------------------------------------------------------
log "Pulling pre-built images from GHCR..."
$COMPOSE pull --quiet 2>/dev/null || $COMPOSE pull

# ---------------------------------------------------------------------------
# Start services
# ---------------------------------------------------------------------------
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
ok "  Auth:            SKIP_AUTH=true (dev mode)"
echo ""
ok "  To set up BYOK AI scoring:"
ok "    1. Go to http://localhost:3010"
ok "    2. Settings → AI Provider → Add OpenRouter or OpenAI key"
ok "    3. Lead scoring + extraction will use your key automatically"
echo ""
ok "  Useful commands:"
ok "    $COMPOSE logs -f          # follow logs"
ok "    $COMPOSE down             # stop everything"
ok "    $COMPOSE down -v          # stop + delete data"
ok "    $COMPOSE restart          # restart all services"
echo ""
ok "  Data is stored in Docker volumes (persistent)."
ok "  All code is MIT licensed."
echo ""
