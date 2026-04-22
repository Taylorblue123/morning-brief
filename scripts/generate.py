#!/usr/bin/env python3
"""
Morning-brief generator.

Given a brief JSON (via --from FILE or stdin), this script:
  1. Validates minimal schema
  2. Writes data/YYYY-MM-DD.json  (copy if not already there)
  3. Updates data/latest.json     (pointer to today's brief)
  4. Rebuilds data/index.json     (archive list, scanned from data/*.json)
  5. Optionally commits + pushes to GitHub so Pages redeploys

Usage:
  python scripts/generate.py --from data/2026-04-22.json --commit --push
  cat brief.json | python scripts/generate.py --commit --push

The agent calls this every morning. All content comes from JSON — no HTML
rewriting. Schema (see SCHEMA.md) is extensible: add a new section `type`
in the JSON, add a matching renderer in assets/render.js.
"""
import argparse, json, os, subprocess, sys, datetime, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

REQUIRED = ["date", "greeting", "sections"]

def load_brief(path: str | None) -> dict:
    if path:
        with open(path, "r") as f:
            return json.load(f)
    return json.load(sys.stdin)

def validate(b: dict) -> None:
    for k in REQUIRED:
        if k not in b:
            raise SystemExit(f"[schema] missing required key: {k}")
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", b["date"]):
        raise SystemExit(f"[schema] date must be YYYY-MM-DD, got: {b['date']}")
    if not isinstance(b["sections"], list):
        raise SystemExit("[schema] sections must be a list")
    b.setdefault("generated_at", datetime.datetime.now().astimezone().isoformat(timespec="seconds"))
    b.setdefault("version", "morning-brief v1")

def write_brief(b: dict) -> pathlib.Path:
    out = DATA / f"{b['date']}.json"
    out.write_text(json.dumps(b, indent=2, ensure_ascii=False))
    (DATA / "latest.json").write_text(json.dumps(b, indent=2, ensure_ascii=False))
    return out

def rebuild_index() -> None:
    briefs = []
    for p in sorted(DATA.glob("*.json")):
        if p.name in ("latest.json", "index.json"):
            continue
        try:
            b = json.loads(p.read_text())
        except Exception:
            continue
        briefs.append({
            "date": b.get("date", p.stem),
            "date_display": b.get("date_display", ""),
            "tldr": b.get("tldr", ""),
            "tldr_short": b.get("tldr_short", "")[:200],
        })
    briefs.sort(key=lambda x: x["date"], reverse=True)
    (DATA / "index.json").write_text(json.dumps({"briefs": briefs}, indent=2, ensure_ascii=False))

def git(*args, check=True) -> str:
    r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise SystemExit(f"git {' '.join(args)} failed:\n{r.stderr}")
    return r.stdout.strip()

def commit_and_push(date: str, push: bool) -> None:
    git("add", "data/")
    status = git("status", "--porcelain")
    if not status:
        print("[git] nothing to commit"); return
    git("commit", "-m", f"brief: {date}")
    print(f"[git] committed brief {date}")
    if push:
        git("push", "origin", "main")
        print("[git] pushed to origin/main")

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="src", help="Brief JSON file (defaults to stdin)")
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--push", action="store_true")
    args = ap.parse_args()

    b = load_brief(args.src)
    validate(b)
    out = write_brief(b)
    rebuild_index()
    print(f"[ok] wrote {out} + latest.json + index.json")

    if args.commit or args.push:
        commit_and_push(b["date"], push=args.push)

if __name__ == "__main__":
    main()
