<div align="center">

# OS20

**Bring Your Own AI. Run a modern CRM.**

One command. Full open-source CRM. Your data stays on your machine.

[Start in 1 minute](#quick-start) · [AI Providers](#ai-providers) · [CLI](#cli) · [Development](#development) · [License](#license)

</div>

---

## What is OS20?

OS20 is a **local-first, open-source CRM** — a fork of [Twenty](https://github.com/twentyhq/twenty), redesigned around a simple idea: the CRM runs on **your** machine, and **you** bring your own AI.

- **No cloud.** No signup. No login. No account creep.
- **Zero auth** — a full CRM dashboard the moment it boots.
- **Bring-your-own AI** — connect OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, or a local Ollama model. 100+ models, no lock-in.
- **Your data stays local** — PostgreSQL on your machine, nothing leaves it.

## Quick Start

The fastest way to run OS20 is the one-line CLI:

```bash
npx os20
```

That's it. The CLI checks Docker, clones OS20, starts PostgreSQL + Redis + the CRM, and opens your browser at <http://localhost:3010>.

**Requirements:** [Docker Desktop](https://docs.docker.com/get-docker/) (macOS / Windows) or Docker Engine (Linux), and Node.js 18+ for the `npx` shim.

### Plain Docker Compose

Prefer raw Compose? Works from this repo too:

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

Ports are offset from the defaults to avoid clashing with other local projects.

## What You Get

- **Full CRM** — Companies, People, Opportunities, Tasks, Notes, Dashboards, Workflows
- **AI Chat** — ask questions about your data in natural language
- **AI Agents** — automate workflows with AI-powered actions
- **Lead generation** — web search, company scraping, and AI lead scoring
- **Bring-your-own-key** — add any provider in Settings → AI Providers
- **100% local** — MySQL-free, Postgres on your box, storage on disk
- **Zero auth** — no signup, no login, no email collection

## AI Providers

Add keys in **Settings → AI Providers** after launch.

| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-4o, GPT-4o-mini, o3, o3-mini, o4-mini |
| **Anthropic** | Claude Sonnet 4, Claude Opus 4, Claude 3.5 Haiku |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash |
| **OpenRouter** | 100+ models from every major provider |
| **Ollama** | Any locally installed model (auto-detected) |
| **Groq** | Llama 3.3 70B, Mixtral 8x7B, and more |

No account required to *try* OS20 — point it at any model you already have and go.

## CLI

The `os20` CLI is published to **npm** and manages the whole lifecycle:

```bash
npx os20            # Start OS20
npx os20 start      # Start OS20
npx os20 stop       # Stop OS20
npx os20 status     # Check status
npx os20 logs       # View logs (`-f` to follow)
npx os20 update     # Pull latest & rebuild
npx os20 reset      # DELETE all data, start fresh
```

OS20 is installed per-user under `~/.os20/`; all app state and data lives with it.

## Repository Layout

```
.
├── docker-compose.yml    # Runs the prebuilt GHCR image + Postgres + Redis
├── .env.example          # Optional AI keys & secret overrides
├── entrypoint-os20.sh    # Local-first startup script (migrate + serve)
├── os20-cli/             # The `npx os20` installer / lifecycle tool
├── os20-landing/         # Landing page served at the root path
└── SEPARATION-GUIDE.md   # How OS20 coexists with other local projects
```

> OS20 is a **slim** distribution: it ships the CLI, landing page, and Docker configuration that pull and run the prebuilt image. The full Twenty monorepo (frontend, server, etc.) is built once into the published container image.

## Development

The image is built from the full Twenty monorepo (with the OS20 modifications). To build a local image from source:

```bash
git clone https://github.com/twentyhq/twenty.git   # or your fork with OS20 changes
cd <repo>
yarn install
yarn dev
```

To rebuild and publish the OS20 container image (requires `write:packages` on GHCR):

```bash
docker build --target twenty \
  -t ghcr.io/omyvnss/os20:latest \
  -f packages/twenty-docker/twenty/Dockerfile .
docker push ghcr.io/omyvnss/os20:latest
```

## Configuration

OS20 works with **zero configuration**. Sensible defaults are baked in.

- **AI keys** — optional. Add `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, or use a local Ollama (`OLLAMA_BASE_URL`).
- **Secrets** — the installer generates them automatically if unset (see `.env.example`).
- **Environment overrides** — copy `.env.example` to `.env` and edit.

## License

**AGPL-3.0** — see [LICENSE](LICENSE).

## Credits

Built on top of the outstanding open-source work of the [Twenty CRM](https://github.com/twentyhq/twenty) team, by the OmOS project.
