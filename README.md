# OS20 — Open-Source CRM with AI Lead Engine

![OS20](https://img.shields.io/badge/OS20-Bring%20Your%20Own%20AI-2ea44f?style=for-the-badge)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)
[![npm](https://img.shields.io/npm/v/os20-cli)](https://www.npmjs.com/package/os20-cli)

<h1>OS20</h1>
<p><strong>Bring Your Own AI. Run a modern CRM.</strong></p>
<p>One command. Full open-source CRM. Your data stays on your machine.</p>

<p>
  <a href="#quick-start">Start in 1 minute</a> ·
  <a href="#ai-providers">AI Providers</a> ·
  <a href="#cli">CLI</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a> ·
  <a href="#development">Development</a> ·
  <a href="#license">License</a>
</p>

---

## Quick Start

```bash
npx os20-cli
```

That's it. The CLI checks Docker, pulls OS20, starts PostgreSQL + Redis + the CRM, and opens your browser at <http://localhost:3010>.

**Requirements:** [Docker Desktop](https://docs.docker.com/get-docker/) (macOS / Windows) or Docker Engine (Linux), Node.js 18+ for the `npx` shim.

### Zero-install (curl) quick start

Prefer a raw one-liner with no npm? Paste this:

```bash
curl -fsSL https://raw.githubusercontent.com/omyvnss/os20/main/install.sh | bash
```

This clones the repo, generates local secrets, pulls both prebuilt images from GitHub Container Registry, and starts the full stack — CRM **plus** the AI Lead Engine.

### Run without npm

Prefer Docker only? Works straight from this repo:

```bash
git clone https://github.com/omyvnss/os20.git
cd os20/os20-pub
docker compose up -d
```

The Compose file pulls prebuilt images from `ghcr.io/omyvnss/os20` and `ghcr.io/omyvnss/os20-leadgen` — no local build required.

---

| Service | Purpose | Port |
|---------|---------|------|
| OS20 CRM | Web app | `3010` |
| OS20 Lead Engine | AI scraping, scoring, email verification (`/health`) | `8120` |
| PostgreSQL | Database | `5433` |
| Redis | Cache | `6380` |

### CRM Dashboard (`:3010`)
- Contacts, Companies, Opportunities, People management
- AI Chat Agent with your own API keys (BYOK)
- Lead Generation page with AI scoring + outreach generation
- Custom objects, views, filters, sorting
- Full GraphQL + REST API

### AI Lead Engine (`:8120`)
Built on **[Scout](https://github.com/kiryano/Scout)** (MIT) + **[ScrapeGraphAI](https://github.com/ScrapeGraphAI/Scrapegraph-AI)**:

| Feature | How it works |
|---------|-------------|
| **Web Search** | Bing API → discovers companies matching your ICP |
| **Company Scraping** | Regex extraction → name, industry, emails, description |
| **AI Extraction** | ScrapeGraphAI SmartScraperGraph (BYOK LLM) → deep structured extraction |
| **AI Scoring** | LLM scores each lead 0-100 against your Ideal Customer Profile |
| **Email Verification** | DNS MX lookup + SMTP RCPT check — verified vs deliverable vs unknown |
| **Outreach Generation** | LLM writes personalized outreach messages per lead |
| **Persistence** | Leads saved to workspace-scoped JSONB store → survive restarts |

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/verify-email` | POST | `{email}` → MX + SMTP verification |
| `/enrich` | POST | `{company, website, description}` → deep scrape + MX + score |
| `/enrich-bulk` | POST | Batch enrichment |
| `/extract` | POST | `{url, provider, apiKey, model}` → ScrapeGraphAI LLM extraction |

---

## BYOK (Bring Your Own Key)

Zero recurring cost. The system uses YOUR API keys for AI:

1. Open **http://localhost:3010** → Settings → AI Providers
2. Save a key for OpenRouter, OpenAI, Anthropic, Google, Groq, or OmniRoute
3. AI chat, workflow AI steps, lead scoring, and outreach use it automatically

Keys are encrypted with your `APP_SECRET` and never shown again after saving.

**Local models:**
- **Ollama** is reached at `host.docker.internal:11434`. On Linux, start Ollama with
  `OLLAMA_HOST=0.0.0.0` so the container can connect.
- **OmniRoute** is reached at `host.docker.internal:20128/v1`. Save any value as its key if
  your router runs without auth.

Without any key, lead scoring falls back to a heuristic score (no AI).

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Docker Compose                        │
│                                                           │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────────────┐ │
│  │ OS20     │  │ Redis   │  │ PostgreSQL               │ │
│  │ :3010    │  │ :6379   │  │ :5432                    │ │
│  │ (CRM)    │  └─────────┘  │ (os20 DB)                │ │
│  │          │                └──────────────────────────┘ │
│  │  NestJS  │                                             │
│  │  + React │  ┌────────────────────────────────────────┐ │
│  │          │  │ OS20 Lead Engine (Python)               │ │
│  │          │◄─┤ :8120                                    │ │
│  │          │  │ FastAPI + ScrapeGraphAI + SMTP verify   │ │
│  └─────────┘  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

The NestJS server calls the Python sidecar over HTTP (`OS20_LEADGEN_URL`).
When the env var is empty, the lead engine is fully disabled — zero regression.

---

## CLI

```bash
npx os20-cli            # Start OS20
npx os20-cli stop       # Stop OS20
npx os20-cli status     # Check status
npx os20-cli logs       # View logs (`-f` to follow)
npx os20-cli update     # Pull latest images & recreate containers
npx os20-cli reset      # DELETE all data, start fresh
```

Secrets live in `~/.os20/.env`, shared by the CLI and `install.sh`. Keep that file: changing
`APP_SECRET` makes saved API keys unreadable.

---

## Running on a server (EC2, VPS)

OS20 has no login screen, so every port is published on `127.0.0.1` only. Never open port
3010 to the internet directly.

- **Just you:** tunnel over SSH, then open <http://localhost:3010>.
  ```bash
  ssh -L 3010:127.0.0.1:3010 you@your-server
  ```
- **A team on a domain:** run a reverse proxy on the same server that requires its own login
  (for example Caddy `basic_auth`), proxy to `127.0.0.1:3010`, and add to `~/.os20/.env`:
  ```bash
  OS20_SERVER_URL=https://crm.example.com
  OS20_ALLOWED_HOSTS=crm.example.com
  ```
- **Workflow HTTP steps** block private and host addresses by default. To call services
  such as n8n on your network, set `OUTBOUND_HTTP_SAFE_MODE_ENABLED=false`.

---

## Development

```bash
# Run sidecar locally
cd services/os20-leadgen
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8120

# Run OS20 locally
cd packages/twenty-server
yarn dev

# Run tests
cd services/os20-leadgen && python -m pytest
```

---

## License

- OS20 core: AGPL-3.0
- Scout enrichment: MIT ([Scout](https://github.com/kiryano/Scout))
- ScrapeGraphAI: MIT ([ScrapegraphAI](https://github.com/ScrapegraphAI/Scrapegraph-AI))
- Lead Engine: MIT

---

## Credits

Built by **Om Yaduvanshi** (CEO) & **Shreyash Raj Shekhar** (CTO) — [git11.xyz](https://git11.xyz)
