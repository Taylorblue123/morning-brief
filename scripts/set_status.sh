#!/usr/bin/env bash
# Agent status updater — call this whenever the agent starts/finishes a task.
# Usage:
#   set_status.sh <status> <headline> [detail]
# Status values: idle | researching | learning | working | building | reviewing | waiting-review | blocked
#
# Example:
#   set_status.sh building "Drafting Crumbs UX audit" "Capturing screenshots, running through 4 MBTI types"
#
# Always commits + pushes to main immediately so the live dashboard reflects real-time state.

set -euo pipefail

STATUS="${1:?status required}"
HEADLINE="${2:?headline required}"
DETAIL="${3:-}"
REPO_DIR="${REPO_DIR:-$HOME/code/morning-brief}"
STATUS_FILE="$REPO_DIR/data/agent-status.json"

cd "$REPO_DIR"

# Preserve started_at if still same task; otherwise reset.
NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
PREV_HEADLINE="$(python3 -c "import json; d=json.load(open('$STATUS_FILE')); print(d.get('headline',''))" 2>/dev/null || echo "")"
if [[ "$PREV_HEADLINE" == "$HEADLINE" ]]; then
  STARTED_AT="$(python3 -c "import json; d=json.load(open('$STATUS_FILE')); print(d.get('started_at', '$NOW_ISO'))")"
else
  STARTED_AT="$NOW_ISO"
fi

python3 - "$STATUS" "$HEADLINE" "$DETAIL" "$STARTED_AT" "$NOW_ISO" "$STATUS_FILE" <<'PY'
import json, sys, pathlib
status, headline, detail, started, updated, path = sys.argv[1:7]
p = pathlib.Path(path)
data = json.loads(p.read_text()) if p.exists() else {}
data.update({
    "status": status,
    "headline": headline,
    "detail": detail,
    "started_at": started,
    "updated_at": updated,
})
# Cap "recent" at 5 entries — moves previous headline into recent when task changes.
recent = data.get("recent", [])
if detail == "__push_to_recent__":
    # Not used directly; kept for future auto-history.
    pass
data["recent"] = recent[:5]
p.write_text(json.dumps(data, indent=2))
PY

git add "$STATUS_FILE"
git -c user.name="agent-status" -c user.email="agent@morning-brief" \
  commit -m "status: $STATUS — $HEADLINE" --quiet || echo "(nothing to commit)"
git push --quiet origin main || echo "(push failed — dashboard may be stale)"
echo "status → $STATUS: $HEADLINE"
