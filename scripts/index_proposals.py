#!/usr/bin/env python3
"""Scan data/proposals/*.md, extract frontmatter (if any) or H1 + first paragraph,
and rebuild data/proposals/index.json. Run after adding a proposal .md."""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROP = ROOT / "data" / "proposals"

def summarize(text):
    # first non-empty paragraph after first H1
    lines = text.splitlines()
    title = None
    summary_lines = []
    in_body = False
    for ln in lines:
        s = ln.strip()
        if title is None and s.startswith("# "):
            title = s[2:].strip()
            in_body = True
            continue
        if in_body:
            if not s:
                if summary_lines: break
                continue
            if s.startswith("#"): continue
            if s.startswith(">") or s.startswith("**") and "status" in s.lower(): continue
            summary_lines.append(s)
            if sum(len(x) for x in summary_lines) > 220: break
    return title, " ".join(summary_lines)[:300]

def main():
    proposals = []
    for p in sorted(PROP.glob("*.md")):
        text = p.read_text()
        title, summary = summarize(text)
        # try to find "Status:" line
        status = None
        mstatus = re.search(r"\*\*Status:\*\*\s*(.+)", text)
        if mstatus: status = mstatus.group(1).split("·")[0].strip()
        mdate = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
        proposals.append({
            "slug": p.stem,
            "title": title or p.stem,
            "date": mdate.group(1) if mdate else "",
            "summary": summary,
            "status": status or "draft",
        })
    proposals.sort(key=lambda x: x["date"], reverse=True)
    (PROP / "index.json").write_text(json.dumps({"proposals": proposals}, indent=2, ensure_ascii=False))
    print(f"[ok] indexed {len(proposals)} proposal(s)")

if __name__ == "__main__":
    main()
