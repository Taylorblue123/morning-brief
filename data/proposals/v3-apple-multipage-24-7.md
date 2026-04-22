# Proposal — Morning Brief v3 + 24/7 Agent Workflow

**Status:** Draft for Wenxuan's review · 2026-04-22
**Author:** Hermes
**Supersedes:** SKILL `wenxuan-morning-brief` v2.x (single-page daily brief)

---

## 1 · What Wenxuan asked for

> "Dashboard design should be more **apple-style, minimalist**. And for important content, it should be **expanded to an inner page / blog / code / interactive visualizations** for more details, not just a single-page brief.
>
> You should also spend your **day time** while I was working reading internal MAE evaluation docs, understanding onboarding docs and evaluators. And when you are **idle**, continue **building side projects** and ask me to review important decisions, big plans, and final results.
>
> Reflect on the feedback I gave you and propose a plan to **extend** the brief dashboard to fit my needs."

Three threads:
1. **Design:** Apple-minimal, multi-page with drill-down depth
2. **Schedule:** Agent should work a full day, not just overnight
3. **Feedback loop:** Make feedback compounding — decisions should stick without re-asking

---

## 2 · Reflection on current state

What works in v2.1:
- Data-driven renderer (no HTML per day) — keep
- Section-type registry is easy to extend — keep
- Linear dark aesthetic scores high on scannability (9/10 vision) — but
  **reads as dev-tool, not premium companion**. Wenxuan wants Apple, not GitHub.

What breaks under the new ask:
- Single page already feels heavy at 8 sections. Adding learning notes + side-project progress + experiment logs would make it unreadable.
- Paper/trends cards show *summary*, but the actual value is *deep reading* — no home for code, interactive viz, or long-form analysis.
- No concept of the agent doing work *during* the day — the whole thing is "overnight → brief → done."
- Preferences live in the agent's memory, not in code. If I restart, they could drift.

So the plan covers **three redesigns**, all self-reinforcing.

---

## 3 · Proposal A — Dashboard v3 (Apple-minimalist + multi-page)

### 3.1 Visual direction

Swap Linear.app dark for Apple design tokens:

| Token | v2 (Linear) | v3 (Apple) |
|---|---|---|
| Canvas | `#08090a` dark | `#000000` hero · `#f5f5f7` info — alternating sections |
| Text | `#f7f8f8` | `#ffffff` on dark · `#1d1d1f` on light |
| Accent | violet `#7170ff` | Apple blue `#0071e3` — the *only* chromatic color |
| Headings | Inter 510, tight -1px | SF Pro Display 56/40/28, line-height 1.07 |
| Body | Inter 400 | SF Pro Text 17px, -0.374 tracking |
| CTAs | subtle outline | pill 980px radius |
| Shadows | multi-layer white tint | single soft `3px 5px 30px / 0.22` |
| Rhythm | one continuous dark canvas | full-height sections alternating black ↔ off-white |

Result: calmer, more premium, more breathing room. Still dark-capable (user can toggle), but default is the Apple cinematic rhythm.

### 3.2 Information architecture — hub + drill-downs

```
/                        Hub (minimal hero + TL;DR + 4 big cards)
├── /today               Expanded focus list with notes
├── /papers/             Reading list index
│   └── /papers/<slug>   ← 📄 full paper brief (sections 3.3)
├── /trends/             Industry pulse index
│   └── /trends/<date>   ← 📈 full daily trends with HN/Reddit/PH threads, charts
├── /projects/           Side projects index
│   └── /projects/<name> ← 🚀 roadmap, PRs, live demo embed, README preview
├── /learning/           MAE knowledge map (new)
│   └── /learning/<doc>  ← ☀️ agent's notes on each onboarding doc / evaluator
├── /experiments/        Overnight results archive
│   └── /experiments/<slug>  ← 🧪 full writeup with code, plots, conclusion
├── /ideas/              Side-idea graveyard + promoted ideas
├── /decisions           ADR log — every choice Wenxuan has made
└── /feedback            Open review-points + reply form
```

Hub (`/`) stays minimal: ~5 sections max visible, each card just *titles* its subject + 1 sentence + link. The inner page is where the agent pours depth.

### 3.3 Inner-page schema (data-driven like v2)

Each inner page is one JSON in `pages/<path>.json`, rendered by a shared template that understands block types:

| Block `type` | Renders |
|---|---|
| `hero` | Full-bleed headline + subtitle |
| `prose` | Markdown body (GFM, mermaid, katex) |
| `code` | Syntax-highlighted block (Prism), copy button |
| `chart` | Inline SVG or p5.js sketch from `./viz/<id>.js` |
| `embed` | iframe (Railway demo, arXiv HTML, YouTube, Figma) |
| `diagram` | Excalidraw JSON or mermaid |
| `checklist` | Interactive TODO (saves state to localStorage) |
| `quote` | Pull-quote for annotations |
| `gallery` | Image grid (screenshots, figures) |

**Example:** `pages/papers/2026-04-22-orogat.json` holds:
`hero` → `prose` (the agent's summary) → `code` (a snippet adapted from the paper) → `chart` (the agent's p5.js visualization of the architecture dimensions) → `embed` (arXiv HTML) → `quote` (Jun's take if known).

Tomorrow's agent doesn't write new CSS — it writes one JSON per deep topic.

### 3.4 Migration path

- v2 routes stay working → `/?date=YYYY-MM-DD` keeps rendering
- v3 hub at `/` = new Apple design
- Each section card on hub links to the v3 inner page when available, falls back to v2 card otherwise
- Full migration is gradual; no big bang

---

## 4 · Proposal B — 24/7 agent workflow (4 modes via cron)

### 4.1 Modes

| Mode | When | Skill loadout | Writes to |
|---|---|---|---|
| 🌅 **Morning brief** | 07:00 daily | `wenxuan-morning-brief` | `data/<date>.json`, posts to Feishu |
| ☀️ **Daytime learning** | every 2h · 09:00–17:00 · weekdays | `feishu-docs-api`, `github-code-review` | `pages/learning/<doc>.json` — reads ONE MAE doc or ONE evaluator, emits structured notes |
| 🌙 **Night builder** | 22:00 daily | `github-pr-workflow`, `test-driven-development`, `subagent-driven-development` | `pages/projects/<name>.json` + draft PR on the side-project repo. Stops at review checkpoint. |
| 🔔 **On-demand review** | triggered by a dashboard button or Feishu `/review` | same as morning | surfaces pending decisions, waits for reply |

### 4.2 Shared ledger

All modes read/write the same files so nothing is lost between runs:
- `data/agent-journal.jsonl` — append-only log of every run (start time, mode, what it did, tokens)
- `data/decisions.json` — ADR of user choices (already started)
- `data/pending-review.json` — things the agent is blocked on; drained by morning brief
- `pages/learning/INDEX.json` — knowledge-map status per MAE doc / evaluator
- `pages/projects/<name>.json` — per-project roadmap, current task, open questions

### 4.3 Safety rails

- Daytime mode: **read-only on TikTok internal stuff**. It drafts notes, never edits MAE source.
- Night builder: can push branches + open draft PRs, but **cannot merge or deploy**. Every big decision goes to `pending-review.json` for his yes/no.
- All autonomous runs log to `agent-journal.jsonl`; one tap on `/feedback` to kill/pause a cron.
- Token budget per mode (default 100k/day) — exceeds? mode auto-pauses, morning brief flags it.

### 4.4 Onboarding velocity target

By end of week 1: knowledge map covers 100% of 6 onboarding docs + ≥60% of 29 evaluators, each with a 1-page note, a code snippet, and a question-log entry. Morning brief shows the climbing ratio as a progress bar.

---

## 5 · Proposal C — Compounding feedback loop

Core idea: **Wenxuan should never have to restate a preference.**

### 5.1 `decisions.json` (already seeded)

Every review-point answer becomes a typed entry:
```json
{
  "id": "D00X",
  "date": "YYYY-MM-DD",
  "topic": "trends-sources",
  "choice": "HN + Reddit + ProductHunt",
  "detail": "...",
  "source": "Wenxuan feedback YYYY-MM-DD"
}
```
Agent loads `decisions.json` at start of every cron run. "How should I pick papers?" is answered in code, forever, until he changes D001.

### 5.2 `/feedback` dashboard page

- Shows current pending review-points as chips — one tap on his phone picks a choice
- Tap writes to `pending-review.json`; next agent run reads it, appends to `decisions.json`, drops the chip
- Also shows full ADR history — he can scroll back and see when/why each choice was made
- Includes a one-field "quick note" box for free-form feedback that auto-files under today's date

### 5.3 Review-points *rules*

Per his latest feedback: **cap 3, min 1 per brief**. If nothing is genuinely pending, surface a low-stakes check-in ("Dashboard rhythm feel right?") rather than leaving empty. This keeps the loop warm.

---

## 6 · Decisions I need from you

I want to lock these in before I build. Reply with IDs (e.g. `Q1 a, Q2 c, Q3 b, Q4 yes`):

- **Q1. Dashboard v3 default theme?**
  (a) Apple dark (black/`#1d1d1f`) · (b) Apple light (`#f5f5f7`) · (c) auto-follow OS · (d) let me toggle via header button

- **Q2. Which inner pages do you want first?** (pick up to 3, I'll ship those in week 1)
  (a) `/papers/*` deep-dive w/ code + viz · (b) `/learning/*` MAE knowledge map · (c) `/projects/*` side-project dashboards · (d) `/experiments/*` overnight results · (e) `/feedback`

- **Q3. Daytime learning cadence?**
  (a) every 2h weekdays 09-17 (default) · (b) twice a day (12:00 + 17:00) · (c) hourly, only while laptop is awake · (d) no daytime runs — overnight only

- **Q4. Night builder — how autonomous?**
  (a) open draft PRs freely, ask before merge · (b) propose commits but wait for my approval to push · (c) only simulate work locally, show me the diff at next brief · (d) skip, no autonomous side-project work yet

- **Q5. OK to run these as cron jobs on your laptop (local) vs. some cloud runner?**
  (a) laptop only for now · (b) move to cloud (GitHub Actions or similar) · (c) decide later

- **Q6. Any hard budget?** token/cost cap per day across all modes?
  Suggested default: 200k tokens/day all-in, morning brief flags when it crosses 80%.

---

## 7 · Rollout plan (if approved)

| Day | Ship |
|---|---|
| **D+0 (today)** | This proposal + `decisions.json` seed + update skill v3 |
| **D+1** | Dashboard v3 hub page (Apple shell), keep v2 body below fold as fallback |
| **D+2** | First two inner-page types (whichever Q2 says) + `/feedback` |
| **D+3** | Daytime learning cron + `/learning/*` knowledge map |
| **D+4** | Night builder cron (scoped to one repo — probably Crumbs) + agent journal viewer |
| **D+5** | Full migration, v2 deprecated, skill v3 locked |
| **D+7** | Review at next Monday's brief — adjust cadence, budgets, pages |

---

## 8 · Why this will age well

- **Data-driven from hub to leaf.** Adding a new deep-dive type = one JSON schema + one renderer.
- **Preferences compound.** Every time Wenxuan corrects me, it lands in `decisions.json` — no memory drift.
- **Agent work is logged.** Agent journal + knowledge map make the agent's labor auditable, not a black box.
- **Apple rhythm scales.** Two background colors + one accent + SF Pro survives any amount of content without visual debt.
