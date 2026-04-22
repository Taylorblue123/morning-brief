# Morning Brief — Data Schema (v1)

Every brief is a single JSON file (`data/YYYY-MM-DD.json`). The page loads
`data/latest.json` by default, or `data/YYYY-MM-DD.json` when `?date=...` is set.

## Top-level fields

| field | type | required | notes |
|---|---|---|---|
| `date` | string | ✓ | `YYYY-MM-DD` |
| `date_display` | string |   | e.g. `Wednesday · Apr 22, 2026` |
| `version` | string |   | stamp shown in header, e.g. `morning-brief v1.0` |
| `generated_at` | ISO string |   | auto-filled by `generate.py` if absent |
| `greeting` | string | ✓ | big headline |
| `tldr` | string |   | 1–2 sentences; supports `**bold**`, `` `code` ``, `[link](url)` |
| `tldr_short` | string |   | ≤200 chars, used on archive listing |
| `sections` | array  | ✓ | rendered in order |

## Section types

Each section object has a `type` matching a renderer in `assets/render.js`.
Unknown types render as an inline error. Add a new type by registering a new
renderer function — no template rewrite needed.

### `focus-cards` — numbered priority cards (3-up)
```json
{ "type": "focus-cards", "icon": "🎯", "title": "Top 3 for today", "meta": "priority",
  "items": [ { "title": "...", "desc": "...", "tag": "work · MAE" } ] }
```

### `paper-brief` — academic paper of the day
```json
{ "type": "paper-brief", "icon": "📄", "title": "Paper of the day",
  "paper": {
    "title": "...", "authors": "A. Author, B. Author et al.",
    "arxiv_id": "2602.03128", "published": "2026-02-03",
    "venue": "cs.AI · arXiv",
    "url": "https://arxiv.org/abs/2602.03128",
    "pdf_url": "https://arxiv.org/pdf/2602.03128",
    "tldr": "One-sentence summary.",
    "why": "Why it matters to Wenxuan (2 sentences max).",
    "key_findings": ["bullet 1", "bullet 2", "bullet 3"]
  } }
```

### `trends` — 3-up industry pulse cards (HN, Reddit, Product Hunt, etc.)
```json
{ "type": "trends", "icon": "📈", "title": "Industry pulse", "meta": "last 48h",
  "items": [ {
    "title": "...", "source": "HN · 273▲", "score": 273,
    "url": "https://news.ycombinator.com/item?id=...",
    "summary": "1 sentence.",
    "why": "So what for Wenxuan (1 sentence)."
  } ] }
```

### `review-points` — questions requiring Wenxuan's input
```json
{ "type": "review-points", "icon": "🔍", "title": "Please review",
  "items": [ {
    "question": "Short question?",
    "context": "Why I'm asking.",
    "options": ["choice A", "choice B", "other"]
  } ] }
```

### `overnight-log` — iteration timeline
```json
{ "type": "overnight-log", "icon": "🌙", "title": "Overnight",
  "items": [ {
    "time": "14:20",
    "status": "shipped",      /* shipped | in-progress | blocked | info */
    "title": "What happened",
    "detail": "Optional deeper detail with `code`/**bold**/[links](url).",
    "links": [{ "label": "PR", "url": "https://..." }]
  } ] }
```

### `pulse-grid` — metric/info cards with optional progress bars
```json
{ "type": "pulse-grid", "icon": "💼", "title": "Work pulse", "meta": "eval team",
  "cards": [ { "rows": [
    { "label": "Docs read", "dot": "green", "bar": 83, "barColor": "green", "value": "5 / 6" },
    { "label": "Manager",   "value": "Jerry Tao" }   /* omit bar for simple two-col row */
  ] } ] }
```
Dots: `green | amber | gray | rose | accent`. Bar colors same set.

### `project-tiles` — project status with progress + NEXT action
```json
{ "type": "project-tiles", "icon": "🚀", "title": "Side projects", "meta": "4 active",
  "items": [ { "name": "Crumbs", "dot": "amber", "status": "ready · Railway",
               "progress": 72, "next": "polish share-card" } ] }
```

### `ideas` — captured thoughts with quote + hashtag chips
```json
{ "type": "ideas", "icon": "💡", "title": "Ideas",
  "items": [ { "title": "...", "quote": "...", "tags": ["#persona", "#ux"] } ] }
```

### `markdown` — free-form paragraph / list block
```json
{ "type": "markdown", "icon": "📚", "title": "Reading",
  "text": "This week: **eval-driven dev** by Jun. [link](https://...)" }
```
Or pre-rendered: `"html": "<ul><li>..</li></ul>"`.

### `html` — arbitrary HTML (escape hatch for charts, images, embeds)
```json
{ "type": "html", "icon": "📊", "title": "Eval pass rate",
  "html": "<img src='./assets/charts/2026-04-22.svg' style='max-width:100%'/>" }
```

## Extending the schema

To add a new widget type (e.g. `calendar`, `chart`, `weather`):
1. Add a renderer in `assets/render.js` under `RENDERERS`
2. Document fields here
3. Use the new `type` in your next brief JSON

No HTML template changes required. The page is pure data → DOM.
