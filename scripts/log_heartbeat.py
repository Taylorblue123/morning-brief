#!/usr/bin/env python3
"""Append a row to data/agent-journal.jsonl so we can confirm cron modes fired."""
import json, sys, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
J = ROOT / "data" / "agent-journal.jsonl"
mode = sys.argv[1] if len(sys.argv) > 1 else "unknown"
row = {"ts": datetime.datetime.now().astimezone().isoformat(timespec="seconds"), "mode": mode, "event": "heartbeat"}
with J.open("a") as f:
    f.write(json.dumps(row, ensure_ascii=False) + "\n")
print(f"[heartbeat] {row}")
