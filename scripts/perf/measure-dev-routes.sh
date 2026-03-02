#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "$SCRIPT_DIR/lib/metrics.sh"

label="current"
base_url="http://localhost:3000"
touch_file=""
dev_log=""
artifact_root="$SCRIPT_DIR/artifacts"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label)
      label="$2"
      shift 2
      ;;
    --base-url)
      base_url="$2"
      shift 2
      ;;
    --touch-file)
      touch_file="$2"
      shift 2
      ;;
    --dev-log)
      dev_log="$2"
      shift 2
      ;;
    --artifact-root)
      artifact_root="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

perf_require_command curl
perf_require_bun

artifact_dir="$artifact_root/$label"
perf_ensure_dir "$artifact_dir"
out_file="$artifact_dir/dev-route-metrics.ndjson"
: > "$out_file"

extract_compiled_sec() {
  local route="$1"
  if [[ -z "$dev_log" || ! -f "$dev_log" ]]; then
    printf ''
    return
  fi

  local line
  line=$(grep "Compiled $route in " "$dev_log" | tail -1 || true)
  if [[ -z "$line" ]]; then
    printf ''
    return
  fi

  local value unit
  value=$(echo "$line" | sed -E 's/.*Compiled .* in ([0-9.]+)(ms|s).*/\1/')
  unit=$(echo "$line" | sed -E 's/.*Compiled .* in ([0-9.]+)(ms|s).*/\2/')

  if [[ -z "$value" || -z "$unit" ]]; then
    printf ''
    return
  fi

  if [[ "$unit" == "ms" ]]; then
    awk -v ms="$value" 'BEGIN { printf "%.3f", ms / 1000 }'
  else
    awk -v sec="$value" 'BEGIN { printf "%.3f", sec }'
  fi
}

measure_route() {
  local route="$1"
  local phase="$2"
  local trigger="$3"

  local request_time_sec
  request_time_sec=$(curl -sS -o /dev/null -w '%{time_total}' "$base_url$route")
  local compiled_in_sec
  compiled_in_sec=$(extract_compiled_sec "$route")
  local timestamp
  timestamp=$(perf_iso8601)

  local json_line
  json_line=$(ROUTE="$route" PHASE="$phase" TRIGGER="$trigger" REQ="$request_time_sec" COMP="$compiled_in_sec" TS="$timestamp" bun -e '
    const compiledRaw = process.env.COMP;
    const payload = {
      route: process.env.ROUTE,
      phase: process.env.PHASE,
      requestTimeSec: Number(process.env.REQ),
      trigger: process.env.TRIGGER,
      timestamp: process.env.TS,
    };
    if (compiledRaw && compiledRaw.length > 0) {
      payload.compiledInSec = Number(compiledRaw);
    }
    console.log(JSON.stringify(payload));
  ')

  perf_append_json_line "$out_file" "$json_line"
  echo "[measure-dev-routes] $phase $route requestTimeSec=$request_time_sec compiledInSec=${compiled_in_sec:-n/a}"
}

measure_route "/" "first-load" "startup"
measure_route "/api/file-tree" "first-load" "startup"

if [[ -n "$touch_file" ]]; then
  touch "$touch_file"
  sleep 0.4
  measure_route "/" "after-change" "file-touch"
fi

measure_route "/" "warm-repeat" "manual"
measure_route "/api/file-tree" "warm-repeat" "manual"

echo "[measure-dev-routes] wrote $out_file"
