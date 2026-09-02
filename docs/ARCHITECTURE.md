# OS20 Architecture

This document describes how OS20 is put together: how the pieces fit, where
your data lives, and how the AI layer works.

## High-Level View

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Machine                          │
│                                                              │
│  ┌────────────┐    ┌──────────────┐    ┌────────────────┐   │
│  │  os20 CLI  │───▶│ Docker       │    │   Your models  │   │
│  │  (npx)     │    │  Compose     │    │  (OpenAI, ...)  │   │
│  └────────────┘    └──────┬───────┘    └────────┬───────┘   │
│                           │                     │           │
│              ┌────────────▼───────────┐        (optional)   │
│              │  OS20 container image  │        Ollama local │
│              │  (ghcr.io/omyvnss/os20)│         model       │
│              └───────┬─────────┬──────┘        (100% offline)│
│                      │         │                             │
│               ┌──────▼───┐ ┌───▼──────┐                     │
│               │ Postgres │ │  Redis   │                     │
│               │  5433    │ │  6380    │                     │
│               └──────────┘ └──────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Components

| Component | Where it lives | What it does |
|-----------|----------------|--------------|
| **CLI** (`cli/`) | npm package `crmos20` | Checks Docker, clones/pulls the app, starts/stop/status/logs/update/reset |
| **Container** | `ghcr.io/omyvnss/os20:latest` | The Twenty frontend + server, prebuilt |
| **PostgreSQL** | Docker volume | All CRM data (companies, people, opportunities, tasks, notes) |
| **Redis** | Docker volume | Cache + queues |
| **Marketing site** (`landing/`) | Lovable (hosted) | Public site — NOT baked into the image; the app opens the CRM dashboard |
| **AI provider layer** | Inside the container | Routes model calls to OpenAI / Anthropic / Google / OpenRouter / Groq / Ollama |

## Where Data Lives

Because OS20 is local-first, **all data stays on your machine**:

- **PostgreSQL data** → a named Docker volume (`os20-data`, `db-data`) on your disk.
- **Uploaded files / storage** → Docker volume mounted at the server's local
  storage path (`STORAGE_TYPE: local`).
- **AI keys** → stored in your local app's settings, never on an OS20 server
  (there is none).
- **Local models** → run by Ollama on your machine; the container talks to it
  over `OLLAMA_BASE_URL`.

Nothing is sent to OS20 (no OS20 cloud exists). If you use a hosted model
(OpenAI, etc.), only your queries go to *that* provider, exactly like using
their API directly.

## How the AI Layer Works

1. You open **Settings → AI Providers** and either paste a key (hosted) or
   pick your local Ollama model.
2. OS20's provider layer (in the container) has adapters for each provider:
   OpenAI, Anthropic, Google, OpenRouter, Groq, and Ollama.
3. When you use AI chat or an AI agent, the request is routed to the provider
   you chose.
4. With Ollama, everything runs **offline** — no internet needed.

## Networking & Ports

| Container | Port |
|-----------|------|
| OS20 app | `3010` (mapped to internal `3000`) |
| PostgreSQL | `5433` (mapped to internal `5432`) |
| Redis | `6380` (mapped to internal `6379`) |

Outgoing connections are made only to AI providers **you** configure (and the
package registry on first install).

## Related

- [DEVELOPMENT.md](DEVELOPMENT.md) — build from source, publish the image
- [README.md](../README.md) — quick start
