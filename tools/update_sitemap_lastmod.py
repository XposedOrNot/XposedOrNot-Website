#!/usr/bin/env python3
"""Refresh <lastmod> dates in sitemap.xml from git history.

Usage:
  python3 tools/update_sitemap_lastmod.py

Maps each <loc> to its page file (/ -> index.html, /xx/ -> xx/index.html,
/name -> name.html) and sets its <lastmod> to the file's last commit date.
Files with uncommitted changes get today's date so a same-day deploy stays
honest. Commits that only touch a page's dateModified line are skipped, so
correcting a stale schema date does not advertise a content change that
never happened. sitemap-breaches.xml is not touched; its dates come from breach
addedDate via generate_breach_pages.py. Rerun after committing page changes.
"""
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITEMAP = ROOT / "sitemap.xml"


def git(args):
    return subprocess.run(["git", "-C", str(ROOT)] + args,
                          capture_output=True, text=True, check=True).stdout


def loc_to_file(loc):
    path = re.sub(r"^https://xposedornot\.com", "", loc.strip())
    if path.endswith("/"):
        return (path + "index.html").lstrip("/")
    rel = (path + ".html").lstrip("/")
    if not (ROOT / rel).exists() and (ROOT / path.lstrip("/") / "index.html").exists():
        return (path.lstrip("/") + "/index.html")
    return rel


def content_changed(rel, sha):
    diff = git(["show", "--format=", "--unified=0", sha, "--", rel])
    lines = [l for l in diff.splitlines()
             if (l.startswith("+") or l.startswith("-"))
             and not l.startswith(("+++", "---"))]
    if not lines:
        return True
    return any("dateModified" not in l for l in lines)


def last_content_commit(rel, depth=8):
    log = git(["log", f"-{depth}", "--format=%H %cs", "--", rel]).splitlines()
    for entry in log:
        sha, _, date = entry.partition(" ")
        if content_changed(rel, sha):
            return date.strip()
    return log[0].partition(" ")[2].strip() if log else ""


def main():
    text = SITEMAP.read_text(encoding="utf-8")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dirty = {line[3:].strip() for line in git(["status", "--porcelain"]).splitlines()}
    changed = []

    def update(m):
        block = m.group(0)
        loc = re.search(r"<loc>([^<]+)</loc>", block)
        old = re.search(r"<lastmod>([^<]+)</lastmod>", block)
        if not loc or not old:
            return block
        rel = loc_to_file(loc.group(1))
        if not (ROOT / rel).exists():
            print(f"WARNING: {loc.group(1)} -> {rel} missing, lastmod left as-is")
            return block
        if rel in dirty:
            date = today
        else:
            date = last_content_commit(rel)
        if not date:
            print(f"WARNING: {rel} has no git history, lastmod left as-is")
            return block
        if date != old.group(1):
            changed.append((loc.group(1), old.group(1), date))
        return block.replace(f"<lastmod>{old.group(1)}</lastmod>",
                             f"<lastmod>{date}</lastmod>")

    text = re.sub(r"<url>.*?</url>", update, text, flags=re.S)
    SITEMAP.write_text(text, encoding="utf-8", newline="")
    for loc, old, new in changed:
        print(f"{loc}: {old} -> {new}")
    print(f"updated: {len(changed)} of {len(re.findall(r'<url>', text))} URLs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
