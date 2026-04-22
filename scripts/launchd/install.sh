#!/usr/bin/env bash
# Install / uninstall launchd jobs for morning-brief cron modes.
# Usage: ./install.sh {install|uninstall|status}

set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LAUNCH_DIR="$HOME/Library/LaunchAgents"
SRC="$(cd "$(dirname "$0")" && pwd)"

JOBS=(
  "com.wenxuan.morning-brief.morning"
  "com.wenxuan.morning-brief.daytime"
  "com.wenxuan.morning-brief.night"
)

cmd="${1:-status}"

install_jobs() {
  mkdir -p "$LAUNCH_DIR"
  for j in "${JOBS[@]}"; do
    out="$LAUNCH_DIR/$j.plist"
    sed "s|PLACEHOLDER_REPO|$REPO_DIR|g" "$SRC/$j.plist" > "$out"
    launchctl unload "$out" 2>/dev/null || true
    launchctl load "$out"
    echo "[ok] loaded $j"
  done
  echo ""
  echo "[info] logs: $REPO_DIR/.logs/"
  echo "[info] uninstall: $0 uninstall"
}

uninstall_jobs() {
  for j in "${JOBS[@]}"; do
    p="$LAUNCH_DIR/$j.plist"
    if [ -f "$p" ]; then
      launchctl unload "$p" 2>/dev/null || true
      rm -f "$p"
      echo "[ok] removed $j"
    fi
  done
}

status_jobs() {
  echo "Installed launchd jobs (morning-brief):"
  listing=$(launchctl list 2>/dev/null | awk '{print $3}')
  for j in "${JOBS[@]}"; do
    if echo "$listing" | grep -qx "$j"; then
      echo "  [loaded] $j"
    else
      echo "  [absent] $j"
    fi
  done
  echo ""
  echo "Next fire times (rough):"
  echo "  morning  : daily 07:00"
  echo "  daytime  : weekdays 12:00 & 17:00"
  echo "  night    : daily 22:00"
}

case "$cmd" in
  install)   install_jobs ;;
  uninstall) uninstall_jobs ;;
  status)    status_jobs ;;
  *) echo "Usage: $0 {install|uninstall|status}"; exit 1 ;;
esac
