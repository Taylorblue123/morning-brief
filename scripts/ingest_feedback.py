#!/usr/bin/env python3
"""Poll GitHub issues labeled `feedback`, turn picks into decisions,
remove answered items from pending-review, close the issue, commit+push.

Auth: uses `gh` CLI (already logged in for Wenxuan's account).
Run frequency: every 10 minutes via Hermes cron.
"""
from __future__ import annotations
import json, re, subprocess, sys, datetime, pathlib

REPO_DIR = pathlib.Path(__file__).resolve().parent.parent
DECISIONS = REPO_DIR / "data" / "decisions.json"
PENDING = REPO_DIR / "data" / "pending-review.json"
JOURNAL = REPO_DIR / "data" / "agent-journal.jsonl"

PICK_RE = re.compile(r"^\s*[-*]\s*\*\*(?P<id>[A-Z]\d{3,4}[a-z]?)\*\*\s*:\s*(?P<choice>.+?)\s*$")
NOTE_HDR_RE = re.compile(r"^##\s+Note\s*$", re.I)


def sh(cmd: list[str], check=True, capture=True) -> str:
    r = subprocess.run(cmd, cwd=REPO_DIR, capture_output=capture, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"cmd failed: {' '.join(cmd)}\n{r.stderr}")
    return r.stdout


def list_open_feedback_issues() -> list[dict]:
    out = sh(["gh", "issue", "list",
              "--label", "feedback",
              "--state", "open",
              "--json", "number,title,body,author,createdAt",
              "--limit", "50"])
    return json.loads(out or "[]")


def parse_body(body: str) -> tuple[list[tuple[str, str]], str]:
    """Return (picks, note). picks is list of (id, choice)."""
    picks: list[tuple[str, str]] = []
    note_lines: list[str] = []
    in_note = False
    for line in (body or "").splitlines():
        if NOTE_HDR_RE.match(line):
            in_note = True
            continue
        if line.startswith("##"):
            in_note = False
            continue
        if line.strip().startswith("---"):
            in_note = False
            continue
        if in_note:
            note_lines.append(line)
            continue
        m = PICK_RE.match(line)
        if m:
            picks.append((m.group("id"), m.group("choice").strip()))
    return picks, "\n".join(note_lines).strip()


def load_json(p: pathlib.Path, default):
    if not p.exists(): return default
    return json.loads(p.read_text())


def write_json(p: pathlib.Path, data) -> None:
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def next_decision_id(decisions: list[dict]) -> str:
    nums = []
    for d in decisions:
        m = re.match(r"^D(\d+)$", d.get("id", ""))
        if m: nums.append(int(m.group(1)))
    n = (max(nums) + 1) if nums else 1
    return f"D{n:03d}"


def ingest_one(issue: dict) -> dict:
    picks, note = parse_body(issue.get("body") or "")
    today = datetime.date.today().isoformat()

    decisions_doc = load_json(DECISIONS, {"decisions": []})
    pending_doc = load_json(PENDING, {"items": []})
    pending_by_id = {it["id"]: it for it in pending_doc.get("items", [])}

    added_ids = []
    resolved_rids = []
    for rid, choice in picks:
        pend = pending_by_id.get(rid)
        did = next_decision_id(decisions_doc["decisions"])
        entry = {
            "id": did,
            "date": today,
            "topic": (pend or {}).get("topic") or rid.lower(),
            "question": (pend or {}).get("question") or f"Response to {rid}",
            "choice": choice,
            "detail": f"Answered via feedback page (issue #{issue['number']}).",
            "source": f"Wenxuan feedback page → GitHub issue #{issue['number']} {today}",
            "linked_review_id": rid,
        }
        decisions_doc["decisions"].append(entry)
        added_ids.append(did)
        if pend:
            resolved_rids.append(rid)

    # Remove resolved items from pending
    if resolved_rids:
        pending_doc["items"] = [it for it in pending_doc.get("items", [])
                                if it["id"] not in resolved_rids]

    # Add note as an ADR-lite entry if present
    if note:
        did = next_decision_id(decisions_doc["decisions"])
        decisions_doc["decisions"].append({
            "id": did,
            "date": today,
            "topic": "note-from-feedback-page",
            "question": "Free-form note from Wenxuan",
            "choice": "recorded",
            "detail": note,
            "source": f"Wenxuan feedback page note → GitHub issue #{issue['number']} {today}",
        })
        added_ids.append(did)

    write_json(DECISIONS, decisions_doc)
    write_json(PENDING, pending_doc)

    # Journal entry
    with JOURNAL.open("a") as f:
        f.write(json.dumps({
            "ts": datetime.datetime.utcnow().isoformat() + "Z",
            "event": "feedback_ingested",
            "issue": issue["number"],
            "picks": [{"rid": r, "choice": c} for r, c in picks],
            "note_len": len(note),
            "decisions_added": added_ids,
            "resolved_review_ids": resolved_rids,
        }) + "\n")

    return {
        "issue": issue["number"],
        "picks": picks,
        "note": note,
        "added": added_ids,
        "resolved": resolved_rids,
    }


def close_issue(num: int, summary: dict) -> None:
    lines = ["Ingested by agent ✅", ""]
    if summary["added"]:
        lines.append(f"Added decisions: `{', '.join(summary['added'])}`")
    if summary["resolved"]:
        lines.append(f"Resolved review items: `{', '.join(summary['resolved'])}`")
    if summary.get("note"):
        lines.append("Note recorded in decisions.json.")
    sh(["gh", "issue", "close", str(num), "--comment", "\n".join(lines)])


def git_commit_push() -> bool:
    sh(["git", "add", "data/decisions.json", "data/pending-review.json", "data/agent-journal.jsonl"])
    rc = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=REPO_DIR).returncode
    if rc == 0:
        return False
    sh(["git", "-c", "user.email=agent@hermes", "-c", "user.name=morning-brief-agent",
        "commit", "-m", "feedback: ingest picks from GitHub issues"])
    sh(["git", "pull", "--rebase", "origin", "main"], check=False)
    sh(["git", "push", "origin", "main"])
    return True


def main() -> int:
    issues = list_open_feedback_issues()
    if not issues:
        print("no open feedback issues")
        return 0
    print(f"found {len(issues)} feedback issue(s)")
    summaries = []
    for iss in issues:
        try:
            s = ingest_one(iss)
            close_issue(iss["number"], s)
            summaries.append(s)
            print(f"  #{iss['number']}: +{len(s['added'])} decisions, resolved {s['resolved']}")
        except Exception as e:
            print(f"  #{iss['number']}: ERROR {e}", file=sys.stderr)
    if summaries:
        pushed = git_commit_push()
        print(f"pushed={pushed}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
