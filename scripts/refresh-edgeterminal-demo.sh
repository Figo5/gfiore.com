#!/usr/bin/env bash
#
# Refresh the static, read-only EdgeTerminal demo in public/edgeterminal/.
#
# Usage:
#   scripts/refresh-edgeterminal-demo.sh /path/to/edgeterminal-checkout [/path/to/edgeterminal.db]
#
# The script starts the EdgeTerminal API in hosted (read-only) mode, captures
# the public API endpoints into a temporary directory, sanitizes absolute paths,
# refuses to install anything that still looks sensitive, and only then replaces
# public/edgeterminal/data/ and copies the web assets into the demo's static/.
#
# Default database: <checkout>/data/edgeterminal.db
# Python:           <checkout>/.venv/bin/python

set -euo pipefail

usage() {
  printf 'Usage: %s /path/to/edgeterminal-checkout [/path/to/edgeterminal.db]\n' \
    "$(basename "$0")"
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

case "${1:-}" in
  -h | --help)
    usage
    exit 0
    ;;
esac

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage >&2
  exit 2
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd -P)
PUBLIC_DIR="$REPO_ROOT/public/edgeterminal"
DATA_DEST="$PUBLIC_DIR/data"
STATIC_DEST="$PUBLIC_DIR/static"

CHECKOUT_ARG=$1
DB_ARG=${2:-}

SERVER_PID=""
TMP_ROOT=""
LOG_FILE=""

cleanup() {
  local status=$?
  local i
  trap '' INT TERM HUP
  trap - EXIT

  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    for i in 1 2 3 4 5 6 7 8 9 10; do
      kill -0 "$SERVER_PID" 2>/dev/null || break
      sleep 0.2 2>/dev/null || true
    done
    if kill -0 "$SERVER_PID" 2>/dev/null; then
      kill -9 "$SERVER_PID" 2>/dev/null || true
    fi
    wait "$SERVER_PID" 2>/dev/null || true
  fi

  if [[ -n "${TMP_ROOT:-}" && -d "$TMP_ROOT" ]]; then
    rm -rf "$TMP_ROOT" || true
  fi

  return "$status"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

# ---------------------------------------------------------------------------
# Preflight: checkout, database, interpreter, web assets
# ---------------------------------------------------------------------------

[[ -d "$CHECKOUT_ARG" ]] || die "checkout directory not found: $CHECKOUT_ARG"
CHECKOUT=$(cd "$CHECKOUT_ARG" && pwd -P) ||
  die "could not resolve checkout directory: $CHECKOUT_ARG"

if [[ -n "$DB_ARG" ]]; then
  DB_PATH=$DB_ARG
else
  DB_PATH="$CHECKOUT/data/edgeterminal.db"
fi

[[ -f "$DB_PATH" ]] || die "database not found: $DB_PATH"
DB_DIR=$(cd "$(dirname "$DB_PATH")" && pwd -P) ||
  die "could not resolve database directory for: $DB_PATH"
DB_ABS="$DB_DIR/$(basename "$DB_PATH")"
[[ -f "$DB_ABS" ]] || die "database not found: $DB_ABS"

PYTHON_BIN="$CHECKOUT/.venv/bin/python"
[[ -x "$PYTHON_BIN" ]] ||
  die "python not found at $PYTHON_BIN (expected <checkout>/.venv/bin/python)"

command -v curl >/dev/null 2>&1 || die "curl is required"

[[ -d "$PUBLIC_DIR" ]] || die "demo directory not found: $PUBLIC_DIR"
[[ -f "$PUBLIC_DIR/index.html" ]] || die "missing demo file: $PUBLIC_DIR/index.html"
[[ -f "$PUBLIC_DIR/shim.js" ]] || die "missing demo file: $PUBLIC_DIR/shim.js"

STATIC_SRC="$CHECKOUT/edgeterminal/web"
[[ -d "$STATIC_SRC" ]] || die "web asset directory not found: $STATIC_SRC"

STATIC_FILES=(style.css product_ui.js nba_ui.js app.js manifest.webmanifest app-icon.svg)
for asset in "${STATIC_FILES[@]}"; do
  [[ -f "$STATIC_SRC/$asset" ]] || die "missing web asset: $STATIC_SRC/$asset"
done

# ---------------------------------------------------------------------------
# Temporary workspace and free port
# ---------------------------------------------------------------------------

TMP_BASE=${TMPDIR:-/tmp}
TMP_BASE=${TMP_BASE%/}
TMP_BASE=${TMP_BASE:-/tmp}
TMP_ROOT=$(mktemp -d "$TMP_BASE/edgeterminal-demo.XXXXXX") ||
  die "could not create a temporary directory"
LOG_FILE="$TMP_ROOT/server.log"
CAPTURE_DATA="$TMP_ROOT/data"

mkdir -p "$CAPTURE_DATA/api/product/nfl" || die "could not create capture directory"

PREFERRED_PORT=8791
PORT=$("$PYTHON_BIN" - "$PREFERRED_PORT" <<'PY'
import socket
import sys

start = int(sys.argv[1])
for candidate in range(start, start + 100):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(("127.0.0.1", candidate))
    except OSError:
        sock.close()
        continue
    sock.close()
    print(candidate)
    break
else:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    print(sock.getsockname()[1])
    sock.close()
PY
) || die "could not find a free port"
[[ -n "$PORT" ]] || die "could not find a free port"

# ---------------------------------------------------------------------------
# Server lifecycle
# ---------------------------------------------------------------------------

start_server() {
  (
    cd "$CHECKOUT" || exit 1
    exec env \
      HOSTED_MODE=1 \
      PUBLIC_URL="https://localhost" \
      ODDS_PROVIDER=espn \
      DATABASE_URL="sqlite:///$DB_ABS" \
      "$PYTHON_BIN" -m uvicorn edgeterminal.api:app \
      --host 127.0.0.1 --port "$PORT"
  ) >"$LOG_FILE" 2>&1 &
  SERVER_PID=$!
}

show_log() {
  if [[ -n "${LOG_FILE:-}" && -f "$LOG_FILE" ]]; then
    printf '%s\n' '--- server log (last 40 lines) ---' >&2
    tail -n 40 "$LOG_FILE" >&2 || true
    printf '%s\n' '--- end server log ---' >&2
  fi
}

wait_for_health() {
  local deadline
  local code

  deadline=$((SECONDS + 60))
  printf 'Waiting for EdgeTerminal API on 127.0.0.1:%s' "$PORT"

  while ((SECONDS < deadline)); do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      printf '\n' >&2
      printf 'ERROR: EdgeTerminal server exited before the API became ready.\n' >&2
      show_log
      return 1
    fi

    code=$(curl -s --noproxy '*' --connect-timeout 2 --max-time 3 \
      -o /dev/null -w '%{http_code}' \
      -H 'Host: localhost' \
      "http://127.0.0.1:$PORT/api/health" || true)

    if [[ "$code" == "200" ]]; then
      printf ' ready\n'
      return 0
    fi

    printf '.'
    sleep 0.5
  done

  printf '\n' >&2
  printf 'ERROR: API health check did not return 200 within 60 seconds.\n' >&2
  show_log
  return 1
}

# ---------------------------------------------------------------------------
# Capture
# ---------------------------------------------------------------------------

capture_json() {
  local api_path=$1
  local out
  local code

  out="$CAPTURE_DATA$api_path.json"
  mkdir -p "$(dirname "$out")" || die "could not create capture directory for $api_path"

  if ! code=$(curl -sS --noproxy '*' --connect-timeout 5 --max-time 60 \
    -H 'Host: localhost' \
    -o "$out" -w '%{http_code}' \
    "http://127.0.0.1:$PORT$api_path"); then
    rm -f "$out"
    die "request failed: GET $api_path"
  fi

  if [[ "$code" != "200" ]]; then
    rm -f "$out"
    die "GET $api_path returned HTTP $code (expected 200)"
  fi
}

# Sanitize every captured JSON file and reject sensitive-looking content.
# Nothing is installed into public/ unless this completes successfully.
sanitize_and_scan() {
  "$PYTHON_BIN" - "$CAPTURE_DATA" "$CHECKOUT" <<'PY'
import json
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
checkout = sys.argv[2].rstrip("/")
prefix = checkout + "/"
home_dir = re.compile(r"/Users/[^/]+/")

forbidden = [
    "/Users/",
    "/home/",
    "@gmail",
    "authtoken",
    "bearer ",
    "api_key",
    "apikey",
    "secret",
    "password",
]

files = sorted(
    (path for path in root.rglob("*.json") if path.is_file()),
    key=lambda item: str(item),
)
if not files:
    sys.exit("no captured JSON files found; public/edgeterminal was not modified")

rewritten = []
hits = []

for path in files:
    rel = path.relative_to(root)
    text = path.read_text(encoding="utf-8")

    try:
        json.loads(text)
    except json.JSONDecodeError as exc:
        sys.exit(
            "captured file is not valid JSON: %s (%s); "
            "public/edgeterminal was not modified" % (rel, exc)
        )

    clean = text.replace(prefix, "")
    clean = home_dir.sub("", clean)

    try:
        json.loads(clean)
    except json.JSONDecodeError as exc:
        sys.exit(
            "sanitizing produced invalid JSON in %s (%s); "
            "public/edgeterminal was not modified" % (rel, exc)
        )

    lowered = clean.lower()
    for pattern in forbidden:
        needle = pattern.lower()
        if needle in lowered:
            for line_no, line in enumerate(clean.splitlines(), 1):
                if needle in line.lower():
                    hits.append((rel, line_no, pattern))

    rewritten.append((path, clean))

if hits:
    sys.stderr.write(
        "Refusing to install capture: forbidden content remains after "
        "sanitizing; public/edgeterminal was not modified.\n"
    )
    for rel, line_no, pattern in hits:
        sys.stderr.write("  %s:%d matches %r\n" % (rel, line_no, pattern))
    sys.exit(1)

for path, clean in rewritten:
    path.write_text(clean, encoding="utf-8")
PY
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

start_server
wait_for_health

printf 'Capturing read-only snapshot from EdgeTerminal...\n'
capture_json /api/config
capture_json /api/account
capture_json /api/product/status
capture_json /api/product/nfl
capture_json /api/product/performance

NFL_JSON="$CAPTURE_DATA/api/product/nfl.json"

GAME_IDS_RAW=$("$PYTHON_BIN" - "$NFL_JSON" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    data = json.load(handle)

if not isinstance(data, dict):
    sys.exit("product/nfl.json is not a JSON object")

games = data.get("games")
if not isinstance(games, list):
    sys.exit("product/nfl.json does not contain a games array")

for game in games:
    if not isinstance(game, dict):
        continue
    game_id = game.get("game_id") or game.get("id")
    if game_id:
        print(game_id)
PY
) || die "could not read game ids from product/nfl.json"

GAME_COUNT=0
while IFS= read -r game_id; do
  game_id=${game_id%$'\r'}
  if [[ -z "$game_id" ]]; then
    continue
  fi

  case "$game_id" in
    */* | *..*)
      die "refusing unsafe game id: $game_id"
      ;;
  esac

  capture_json "/api/product/nfl/$game_id"
  GAME_COUNT=$((GAME_COUNT + 1))
done <<<"$GAME_IDS_RAW"

printf 'Sanitizing captured data and scanning for sensitive content...\n'
sanitize_and_scan

WEEK=$("$PYTHON_BIN" - "$NFL_JSON" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    data = json.load(handle)

if not isinstance(data, dict):
    sys.exit("product/nfl.json is not a JSON object")

week = data.get("week")
print("" if week is None else week)
PY
) || die "could not read week from product/nfl.json"

TOTAL_SIZE=$("$PYTHON_BIN" - "$CAPTURE_DATA" <<'PY'
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
total = sum(path.stat().st_size for path in root.rglob("*") if path.is_file())
value = float(total)

for unit in ("B", "KB", "MB", "GB"):
    if value < 1024.0 or unit == "GB":
        if unit == "B":
            print("%d B" % total)
        else:
            print("%.1f %s" % (value, unit))
        break
    value /= 1024.0
PY
) || die "could not calculate capture size"

printf 'Installing snapshot into public/edgeterminal...\n'
rm -rf "$DATA_DEST" || die "could not remove existing data directory: $DATA_DEST"
cp -R "$CAPTURE_DATA" "$DATA_DEST" || die "could not install captured data into $DATA_DEST"

mkdir -p "$STATIC_DEST" || die "could not create static directory: $STATIC_DEST"
for asset in "${STATIC_FILES[@]}"; do
  cp "$STATIC_SRC/$asset" "$STATIC_DEST/$asset" ||
    die "could not copy web asset into static: $asset"
done

printf '\nEdgeTerminal demo refreshed.\n'
printf '  Games: %s\n' "$GAME_COUNT"
printf '  Week:  %s\n' "${WEEK:-unknown}"
printf '  Data:  %s\n' "$TOTAL_SIZE"
