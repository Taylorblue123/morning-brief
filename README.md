# 🌅 Morning Brief

Self-updating, data-driven daily dashboard. Deployed via GitHub Pages.

**Live:** https://taylorblue123.github.io/morning-brief/
**Archive:** https://taylorblue123.github.io/morning-brief/archive.html

## How it works

```
┌────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Agent builds   │───▶│ scripts/generate │───▶│ git push → Pages │
│ brief JSON     │    │ .py              │    │ redeploys        │
└────────────────┘    └──────────────────┘    └─────────────────┘
                             │
                             ▼
                      data/YYYY-MM-DD.json
                      data/latest.json       ← index.html fetches this
                      data/index.json        ← archive.html fetches this
```

- **`index.html`** is a thin shell — loads `data/latest.json` and renders via `assets/render.js`.
- **`assets/render.js`** has a renderer per section `type`. Adding a new widget = one new function, no HTML rewrite.
- **Content lives in JSON.** The agent never writes HTML anymore.

## Generate a new brief

```bash
# write data/2026-04-23.json in the schema from SCHEMA.md, then:
python scripts/generate.py --from data/2026-04-23.json --commit --push
```

This updates `latest.json`, rebuilds `index.json`, commits, and pushes. GitHub Pages publishes in ~30 s.

## Schema

See [SCHEMA.md](./SCHEMA.md). Current section types: `focus-cards`, `pulse-grid`, `project-tiles`, `ideas`, `markdown`, `html`.

## Design system

Linear.app dark — Inter + JetBrains Mono, `#08090a` canvas, violet accent `#7170ff`. See `assets/style.css`.
