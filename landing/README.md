# OS20 Landing Page

A self-contained, static marketing site for OS20 — the Bring-Your-Own-AI CRM.

Built from an OpenDesign export and wired into this repo with copy customized
to the actual OS20 product (BYOK AI, workflows, lead scraping, MCP, Postgres).

## Pages

- `index.html` — Home (hero, BYOK providers, workflows, GTM, FAQ)
- `product.html` — Product (features, AI band, atlas flow, no-code)
- `docs.html` — Docs / introduction

## Run it (local preview)

Any static file server works:

```bash
cd landing
python3 -m http.server 8080
# or
npx serve .
```

Open http://localhost:8080

## Assets (images + fonts)

The HTML references assets under relative paths, e.g.:

```
assets/images/twenty.com/figma-f09351e08b.webp
assets/fonts/twenty.com/host_grotesk_latin_variable-s.p.15va9ht5r_l-h-2850a099a5.woff2
```

Drop your exported `assets/` folder (with `images/` and `fonts/` intact) into
this directory so it sits **next to** `index.html`:

```
landing/
├── index.html
├── product.html
├── docs.html
├── styles.css
├── script.js
└── assets/
    ├── fonts/twenty.com/...
    └── images/twenty.com/...
```

The site degrades gracefully (company logos fall back to styled initials,
fonts fall back to system-ui) until you add the assets.

## Notes

- `legacy-index.html` — the previous single-page OS20 landing, kept as a
  reference. Not linked from the nav.
- "GET STARTED" buttons point at `http://localhost:3010/welcome` (the OS20 app
  server). Change the host or remove when deploying separately.
