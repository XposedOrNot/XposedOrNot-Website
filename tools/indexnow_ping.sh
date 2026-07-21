#!/usr/bin/env bash
set -euo pipefail

HOST="xposedornot.com"
KEY="52523706bb2c4a3d154888818299e6f9"
ENDPOINT="https://api.indexnow.org/indexnow"

if [ $# -eq 0 ]; then
  echo "usage: $(basename "$0") URL_OR_PATH [URL_OR_PATH ...]" >&2
  echo "example: $(basename "$0") /breach/Paytm /xposed /our-repository" >&2
  exit 1
fi

urls=""
for u in "$@"; do
  case "$u" in
    https://"$HOST"/*) full="$u" ;;
    /*) full="https://$HOST$u" ;;
    *)
      echo "skipping $u (not a path or https://$HOST URL)" >&2
      continue
      ;;
  esac
  urls="$urls\"$full\","
done
urls="${urls%,}"

if [ -z "$urls" ]; then
  echo "no valid URLs to submit" >&2
  exit 1
fi

payload="{\"host\":\"$HOST\",\"key\":\"$KEY\",\"keyLocation\":\"https://$HOST/$KEY.txt\",\"urlList\":[$urls]}"

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "$payload"
  exit 0
fi

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$payload" \
  -w "IndexNow response: HTTP %{http_code}\n"
