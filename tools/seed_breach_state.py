#!/usr/bin/env python3
"""Seed tools/breach_page_state.json from git history.

Usage:
  python3 tools/seed_breach_state.py [--source FILE]

One-off bootstrap for the dateModified state file. Every breach page that
already exists gets the date of the last commit that touched it, so the
pass that introduces this file does not claim that 783 pages were updated
today. The hash is taken from the current generator output, so the next
generator run sees no drift and leaves those dates alone.

Only this script reads git; generate_breach_pages.py never does. Run it
once, review the file, commit it with the pages.
"""
import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_breach_pages as gen


def commit_dates():
    out = subprocess.run(
        ["git", "-C", str(gen.ROOT), "log", "--format=%cs", "--name-only",
         "--", "breach"],
        capture_output=True, text=True, check=True).stdout
    dates, current = {}, None
    for line in out.splitlines():
        line = line.strip()
        if not line:
            continue
        if len(line) == 10 and line[4] == "-" and line[7] == "-":
            current = line
        elif line.endswith(".html") and current:
            stem = Path(line).stem
            dates.setdefault(stem, current)
    return dates


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", help="read breaches JSON from file instead of the API")
    args = ap.parse_args()

    if gen.STATE_FILE.exists():
        print(f"ERROR: {gen.STATE_FILE.name} already exists, refusing to overwrite")
        return 2

    if args.source:
        data = json.load(open(args.source, encoding="utf-8"))
    else:
        data = json.loads(gen.urllib.request.urlopen(
            gen.urllib.request.Request(
                gen.API,
                headers={"User-Agent": "XposedOrNot-page-generator/1.0"}),
            timeout=30).read())
    rows = data["exposedBreaches"]

    dates = commit_dates()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    state, seeded, fresh = {}, 0, 0
    for breach in rows:
        bid = breach["breachID"]
        if not (gen.OUT_DIR / f"{bid}.html").exists():
            continue
        modified = dates.get(bid)
        if modified:
            seeded += 1
        else:
            modified = breach["addedDate"][:10]
            fresh += 1
        state[bid] = {
            "hash": gen.page_fingerprint(breach, gen.display_name(bid)),
            "modified": modified,
            "source": "seed",
        }

    gen.save_state(state)
    print(f"seeded {len(state)} pages | {seeded} from git history | "
          f"{fresh} fell back to addedDate | run date would have been {today}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
