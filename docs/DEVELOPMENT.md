# Development

Guide for people who want to build OS20 from source, run it in development,
or publish new versions.

## Prerequisites

- Node.js 20+ (for the CLI)
- `yarn` (recommended) or `npm`
- Docker Desktop / Docker Engine
- A Postgres + Redis (or Docker for both)

## Repository Layout

```
.
├── cli/                 # The npm package `os20` (bin: os20)
│   ├── src/index.ts     # Single-file CLI (Commander)
│   └── dist/            # Compiled output (published to npm)
├── landing/             # Static marketing pages
├── docs/                # This documentation
├── docker-compose.yml   # Runs the prebuilt container + Postgres + Redis
└── entrypoint-os20.sh   # Local-first startup (migrate + serve)
```

## The CLI

```bash
cd cli
npm install
npm run build     # compiles src/ → dist/
npm start         # runs the CLI from dist
npm run dev       # runs from source via tsx
```

Publishing a new version of the npm package:

```bash
cd cli
npm version patch   # or minor / major
npm publish         # requires npm login
```

## The Container Image

The production image (`ghcr.io/omyvnss/os20`) is built from the **full Twenty
monorepo** with the OS20 modifications (multi-provider AI layer, local-first
auth bypass, lead generation module, plus the landing site baked in).

To build from source, you need the full fork. Then:

```bash
docker build --target twenty \
  -t ghcr.io/omyvnss/os20:latest \
  -f packages/twenty-docker/twenty/Dockerfile .
docker push ghcr.io/omyvnss/os20:latest   # requires write:packages on GHCR
```

If you'd rather build the frontend/server directly (not via Docker):

```bash
git clone https://github.com/twentyhq/twenty.git
cd twenty
yarn install
yarn dev          # starts the Twenty dev environment
```

## Running the stack locally

```bash
docker compose up -d
# → http://localhost:3010
```

Teardown:

```bash
docker compose down          # keep data volumes
docker compose down -v       # delete data volumes (DESTROYS all data)
```

## Testing the CLI end-to-end

Before publishing, verify the package tarball is correct:

```bash
cd cli
npm pack --dry-run     # shows exactly which files ship
```

## Publishing Checklist

1. `npm pack --dry-run` in `cli/` — confirm only `dist/` + `package.json` ship.
2. Bump `cli/package.json` version.
3. `npm publish` (tag a release on GitHub for provenance).
4. Rebuild + push the container image if the app changed.
5. Verify: `npx os20 status` on a clean machine.
