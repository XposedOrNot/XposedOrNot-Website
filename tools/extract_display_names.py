#!/usr/bin/env python3
"""Propose human-readable display names for breach IDs.

Usage:
  python3 tools/extract_display_names.py [--source FILE] [--id BREACHID]

Reads /v1/breaches (or a cached JSON file) and, for every breach ID that
has no entry in tools/breach_display_names.json, looks for the same
letters inside the breach's own exposureDescription and reports the
spelling used there. An ID ending in -YYYY is reported as "Name (YYYY)".

Proposals are printed for review and are never written to the curated
file: names ship only after a human approves them. Run this when a new
breach is added, before generate_breach_pages.py.
"""
import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

API = "https://api.xposedornot.com/v1/breaches"
ROOT = Path(__file__).resolve().parent.parent
NAMES_FILE = ROOT / "tools" / "breach_display_names.json"
YEAR_SUFFIX = re.compile(r"-((?:19|20)\d\d)$")


def norm(value):
    return re.sub(r"[^a-z0-9]", "", value.lower())


def split_year(bid):
    m = YEAR_SUFFIX.search(bid)
    return (bid[:m.start()], m.group(1)) if m else (bid, None)


def find_in_description(base, desc):
    target = norm(base)
    if not target:
        return None
    chars = [(i, c) for i, c in enumerate(desc) if c.isalnum()]
    pos = norm("".join(c for _, c in chars)).find(target)
    if pos == -1:
        return None
    return desc[chars[pos][0]:chars[pos + len(target) - 1][0] + 1]


def propose(breach):
    bid = breach["breachID"]
    base, year = split_year(bid)
    found = find_in_description(base, str(breach.get("exposureDescription") or ""))
    if found is None:
        return (f"{base} ({year})" if year else None), "no name in description"
    if found.lower() == base.lower() and found != base:
        return (f"{base} ({year})" if year else found), "capitalisation only, needs review"
    name = f"{found} ({year})" if year else found
    return (name if name != bid else None), "from description"


def load_names():
    if NAMES_FILE.exists():
        return json.loads(NAMES_FILE.read_text(encoding="utf-8"))
    return {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", help="read breaches JSON from file instead of the API")
    ap.add_argument("--id", action="append", dest="ids", metavar="BREACHID",
                    help="propose for this breach only (repeatable)")
    args = ap.parse_args()

    if args.source:
        data = json.load(open(args.source, encoding="utf-8"))
    else:
        req = urllib.request.Request(
            API, headers={"User-Agent": "XposedOrNot-page-generator/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.load(resp)
    rows = data["exposedBreaches"]

    known = load_names()
    if args.ids:
        wanted = set(args.ids)
        rows = [r for r in rows if r["breachID"] in wanted]
        missing = wanted - {r["breachID"] for r in rows}
        for bid in sorted(missing):
            print(f"ERROR: unknown breachID {bid}")
        if missing:
            return 2

    proposals, keep = [], []
    for breach in sorted(rows, key=lambda r: r["breachID"].lower()):
        bid = breach["breachID"]
        if bid in known:
            continue
        name, why = propose(breach)
        if name:
            proposals.append((bid, name, why))
        else:
            keep.append(bid)

    for bid, name, why in proposals:
        print(f"{bid:<34} {name:<40} ({why})")
    print(f"\n{len(proposals)} proposed | {len(keep)} keep their ID | "
          f"{len(known)} already curated")
    if proposals:
        print("\nApproved entries go in tools/breach_display_names.json:")
        print(json.dumps({b: n for b, n, _ in proposals},
                         indent=2, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
