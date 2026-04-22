#!/usr/bin/env bash
# Morning brief generator entrypoint.
# Called by launchd (macOS) or GitHub Actions.
# Env: MODE={morning|daytime|night}  (default: morning)
#      BRIEF_DATE=YYYY-MM-DD         (default: today)

set -euo pipefail

MODE="${MODE:-morning}"
BRIEF_DATE="${BRIEF_DATE:-$(date +%F)}"
REPO_DIR="${REPO_DIR:-$HOME/code/morning-brief}"
LOG_DIR="$REPO_DIR/.logs"
mkdir -p "$LOG_DIR"

cd "$REPO_DIR"
exec >>"$LOG_DIR/${MODE}-${BRIEF_DATE}.log" 2>&1

echo "============================================================"
echo "[$(date)] mode=$MODE date=$BRIEF_DATE"
echo "============================================================"

case "$MODE" in
  morning)
    # For now: if today's data file exists, just re-run generate+push.
    # The actual brief-authoring step will be the agent running a prompt.
    if [ -f "data/${BRIEF_DATE}.json" ]; then
      python3 scripts/generate.py --from "data/${BRIEF_DATE}.json" --commit --push || true
    else
      echo "[WARN] no data/${BRIEF_DATE}.json — agent needs to author brief first"
      echo "[WARN] run: hermes prompt morning-brief (or manually create the JSON)"
    fi
    ;;
  daytime)
    echo "[daytime] learning pass stub — writes one page to data/pages/learning/"
    # TODO: invoke agent with skill `wenxuan-morning-brief` + `feishu-docs-api`
    # Placeholder: just touch a heartbeat file so we can verify cron fired.
    python3 scripts/log_heartbeat.py "$MODE"
    ;;
  night)
    echo "[night] builder stub — drafts PRs on side projects"
    python3 scripts/log_heartbeat.py "$MODE"
    ;;
  *)
    echo "[ERROR] unknown mode: $MODE"
    exit 1
    ;;
esac

echo "[$(date)] mode=$MODE done"
