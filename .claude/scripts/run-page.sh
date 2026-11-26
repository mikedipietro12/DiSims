#!/bin/bash
# Open one page of this repo in headless Chrome and print what it shows.
# Serves the repo on localhost only, for the length of the run, then stops the server.
#
#   .claude/scripts/run-page.sh chemistry-11h/bonding/dev/draw-test.html?selftest
#       prints the PASS / FAIL lines (or, if there are none, the page text)
#   .claude/scripts/run-page.sh chemistry-11h/bonding/lab.html --shot out.png [WIDTHxHEIGHT]
#       saves a screenshot instead (default 1280x900)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PAGE="${1:?usage: run-page.sh <path-in-repo[?query]> [--shot file.png [WxH]]}"
PAGE="${PAGE#/}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8765

python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
PROFILE="$(mktemp -d)"
trap 'kill "$SERVER" 2>/dev/null; wait "$SERVER" 2>/dev/null || true; rm -rf "$PROFILE"' EXIT
for _ in $(seq 1 30); do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 0.1; done

URL="http://127.0.0.1:$PORT/$PAGE"
FLAGS=(--headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" --virtual-time-budget=15000)

if [ "${2:-}" = "--shot" ]; then
  OUT="${3:?--shot needs a file name}"
  SIZE="${4:-1280x900}"
  "$CHROME" "${FLAGS[@]}" --hide-scrollbars --window-size="${SIZE/x/,}" --screenshot="$OUT" "$URL" 2>/dev/null
  echo "Saved $OUT"
else
  DOM="$("$CHROME" "${FLAGS[@]}" --dump-dom "$URL" 2>/dev/null)"
  RESULTS="$(printf '%s' "$DOM" | sed -e 's/<[^>]*>//g' | grep -oE '(PASS|FAIL) .*' || true)"
  if [ -n "$RESULTS" ]; then
    printf '%s\n' "$RESULTS"
    echo "---"
    echo "$(printf '%s\n' "$RESULTS" | grep -c '^PASS') passed, $(printf '%s\n' "$RESULTS" | grep -c '^FAIL' || true) failed"
  else
    printf '%s' "$DOM" | sed -e 's/<[^>]*>/ /g' | tr -s ' \n' | head -c 4000
  fi
fi
