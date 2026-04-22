# Morning Brief — cron infrastructure

Three modes, two runners. Laptop-local is primary (D008); cloud is the
always-on supplement.

## Modes

| Mode      | When                             | Runner        | What it does |
|-----------|----------------------------------|---------------|--------------|
| `morning` | daily 07:00 local                | launchd + GHA | Runs the morning-brief agent, regenerates `data/latest.json`, pushes. |
| `daytime` | weekdays 12:00 & 17:00 local     | launchd       | Picks ONE MAE doc/evaluator, writes `data/pages/learning/<slug>.json`. Also triggered when agent is idle. |
| `night`   | daily 22:00 local                | launchd       | Picks a side-project task, opens a **draft PR** on that repo. Stops at review. |

## Install on your laptop (macOS)

```bash
cd ~/code/morning-brief/scripts/launchd
chmod +x install.sh run-mode.sh  # one-time
./install.sh install    # load all three jobs into launchd
./install.sh status     # check what's loaded
./install.sh uninstall  # remove all three
```

Logs stream to `~/code/morning-brief/.logs/`. A heartbeat row is appended to
`data/agent-journal.jsonl` on every run — morning brief surfaces the latest.

### Manually test one mode

```bash
MODE=daytime REPO_DIR=~/code/morning-brief ./run-mode.sh
```

## GitHub Actions fallback (cloud supplement)

File `.github/workflows/morning-brief.yml` runs `morning` mode at 07:15 UTC+8
(23:15 UTC) as a safety net — if your laptop was asleep at 07:00 local, the
brief still exists by the time you're reading it. It does **not** run the
daytime or night modes (those require local repo + credentials).

Trigger on-demand: `gh workflow run morning-brief.yml`.

## Budget (D009)

No hard cap for now. Token usage is appended to `agent-journal.jsonl` per run.
If a provider returns rate-limit, the agent appends a blocking item to
`data/pending-review.json` and surfaces it in the next morning brief.

## Safety rails (D007)

- Night mode always opens **draft PRs**. Never merges, never force-pushes.
- Daytime mode is **read-only** with respect to TikTok-internal repos. It
  only writes notes into `data/pages/learning/`.
- Every commit by the agent lands on a non-`main` branch in side-project
  repos, with a PR for your review.

## Enable / disable a mode without uninstalling

Laptop: `launchctl unload ~/Library/LaunchAgents/com.wenxuan.morning-brief.daytime.plist`
(reload with `launchctl load …`).

Cloud: flip the `on.schedule` block in `.github/workflows/morning-brief.yml`.
