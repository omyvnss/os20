# OS20 vs Terminal SaaS — Project Separation Guide

## Directory Structure

```
/Users/omyadav/
├── Terminal SaaS/          # YOUR OTHER PROJECT (adfolio/Signal)
│   ├── .opencode/
│   ├── .venv/
│   ├── signal/
│   ├── pyproject.toml
│   └── uv.lock
│
└── os20/                   # OS20 CRM (this project)
    ├── packages/
    │   ├── twenty-server/
    │   ├── twenty-front/
    │   ├── os20-cli/
    │   └── os20-landing/
    ├── docker-compose.yml
    └── README.md
```

## Port Assignments (NO CONFLICTS)

| Service | Terminal SaaS (adfolio) | OS20 CRM |
|---------|------------------------|----------|
| App | 3000 | **3010** |
| PostgreSQL | 5432 | **5433** |
| Redis | 6379 | **6380** |

## Rules

1. **Never run OS20 commands from Terminal SaaS directory**
2. **Never run Terminal SaaS commands from OS20 directory**
3. **Each project has its own Docker Compose, its own .env, its own data**
4. **OS20 uses ports 3010/3011/5433/6380 — never 3000/3001/5432/6379**

## Quick Reference

```bash
# Terminal SaaS
cd ~/Terminal\ SaaS
# ... your existing commands

# OS20
cd ~/os20
npx os20 start
# → Opens http://localhost:3011
```

## If Something Goes Wrong

```bash
# Check what's running on ports
lsof -i :3000 -i :3001 -i :3010 -i :3011

# Stop OS20
cd ~/os20 && docker compose down

# Stop Terminal SaaS (if using Docker)
cd ~/Terminal\ SaaS && docker compose down
```
