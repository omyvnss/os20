<div align="center">

![OS20](https://img.shields.io/badge/OS20-Bring%20Your%20Own%20AI-2ea44f?style=for-the-badge)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)

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

</div>

---

## What is OS20?

**OS20** is a **local-first, open-source CRM** — a fork of [Twenty](https://github.com/twentyhq/twenty), redesigned around one simple idea: the CRM runs on **your** machine, and **you** bring your own AI.

- **No cloud, no signup, no login.** Zero auth — a full CRM dashboard the moment it boots.
- **Bring-your-own AI.** Connect OpenAI, Anthropic, Google Gemini, OpenRouter, Groq — or a local, private **Ollama** model. 100+ models, zero lock-in.
- **Your data stays local.** PostgreSQL + storage run on your machine. Nothing leaves it.
- **Local-first AI.** Use a fully offline local model and your CRM + AI run with **no internet at all**.

## Quick Start

The fastest way to run OS20 is the one-line CLI:

```bash
npx os20
```

That's it. The CLI checks Docker, pulls OS20, starts PostgreSQL + Redis + the CRM, and opens your browser at <http://localhost:3010>.

**Requirements:** [Docker Desktop](https://docs.docker.com/get-docker/) (macOS / Windows) or Docker Engine (Linux), Node.js 18+ for the `npx` shim.

### Run without npm

Prefer Docker only? Works straight from this repo:

```bash
git clone https://github.com/omyvnss/os20.git
cd os20
docker compose up -d
# → http://localhost:3010
```

The Compose file pulls a prebuilt image from `ghcr.io/omyvnss/os20` — no local build required.

### Ports

| Service | Purpose | Port |
|---------|---------|------|
| OS20 CRM | Web app | `3010` |
| PostgreSQL | Database | `5433` |
| Redis | Cache | `6380` |

Ports are offset from the defaults so OS20 never clashes with other local projects.

## What You Get

- **Full CRM** — Companies, People, Opportunities, Tasks, Notes, Dashboards, Workflows
- **AI Chat** — ask questions about your data in natural language
- **AI Agents** — automate workflows with AI-powered actions
- **Lead generation** — web search, company scraping, and AI lead scoring
- **Bring-your-own-key** — add any provider in Settings → AI Providers
- **100% local** — PostgreSQL + storage on your disk, Ollama auto-detected
- **Zero auth** — no signup, no login, no email collection

## AI Providers

Add keys in **Settings → AI Providers** after launch — or use a fully local model.

| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-4o, GPT-4o-mini, o3, o3-mini, o4-mini |
| **Anthropic** | Claude Sonnet 4, Claude Opus 4, Claude 3.5 Haiku |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash |
| **OpenRouter** | 100+ models from every major provider |
| **Groq** | Llama 3.3 70B, Mixtral 8x7B, and more |
| **Ollama** | Any locally installed model (auto-detected, fully offline) |

No account required to try OS20 — point it at any model you already have and go.

## CLI

The `os20` CLI is published to **npm** and manages the whole lifecycle:

```bash
npx os20            # Start OS20
npx os20 start      # Start OS20
npx os20 stop       # Stop OS20
npx os20 status     # Check status
npx os20 logs       # View logs (`-f` to follow)
npx os20 update     # Pull latest image & recreate containers
npx os20 reset      # DELETE all data, start fresh
```

OS20 installs per-user under `~/.os20/`; all app state and data lives with it.

## Repository Layout

```
.
├── cli/                 # The `os20` npm CLI (installer + lifecycle tool)
├── landing/             # Landing page served at the app root path
├── docs/                # Architecture & configuration guides
├── docker-compose.yml   # Runs the prebuilt GHCR image + PostgreSQL + Redis
├── .env.example         # Optional AI keys & secret overrides
└── entrypoint-os20.sh   # Local-first startup (migrate + serve)
```

> **Slim distribution.** OS20 ships the CLI, landing page, and Docker configuration that run the prebuilt image. The full Twenty monorepo (frontend, server) is built once into the published container image.

## Development

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full picture.

The container image is built from the full Twenty monorepo with the OS20 modifications. To rebuild and publish (requires `write:packages` on GHCR):

```bash
docker build --target twenty \
  -t ghcr.io/omyvnss/os20:latest \
  -f packages/twenty-docker/twenty/Dockerfile .
docker push ghcr.io/omyvnss/os20:latest
```

## Configuration

OS20 works with **zero configuration**. Sensible defaults are baked in.

- **AI keys** — optional. Add `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, or use a local Ollama (`OLLAMA_BASE_URL`).
- **Secrets** — generated automatically if unset (see `.env.example`).
- **Environment overrides** — copy `.env.example` to `.env` and edit.

## License

**AGPL-3.0** — see [LICENSE](LICENSE).

## Credits

Built on top of the outstanding open-source work of the [Twenty CRM](https://github.com/twentyhq/twenty) team, by the OmOS project.
