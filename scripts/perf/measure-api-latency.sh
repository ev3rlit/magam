#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "$SCRIPT_DIR/lib/metrics.sh"

label="current"
samples=20
direct_base_url="http://localhost:3002"
proxy_base_url="http://localhost:3000/api"
render_file="examples/overview.tsx"
artifact_root="$SCRIPT_DIR/artifacts"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --label)
      label="$2"
      shift 2
      ;;
    --samples)
      samples="$2"
      shift 2
      ;;
    --direct-base-url)
      direct_base_url="$2"
      shift 2
      ;;
    --proxy-base-url)
      proxy_base_url="$2"
      shift 2
      ;;
    --render-file)
      render_file="$2"
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

if ! [[ "$samples" =~ ^[0-9]+$ ]] || [[ "$samples" -lt 1 ]]; then
  echo "--samples must be a positive integer" >&2
  exit 1
fi

perf_require_command curl
perf_require_bun

artifact_dir="$artifact_root/$label"
perf_ensure_dir "$artifact_dir"
out_file="$artifact_dir/api-metrics.ndjson"
: > "$out_file"

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

request_time_ms() {
  local base_url="$1"
  local endpoint="$2"
  local method="$3"
  local body="${4:-}"

  local full_url="${base_url%/}${endpoint}"
  local seconds

  if [[ "$method" == "POST" ]]; then
    seconds=$(curl -sS -o /dev/null -w '%{time_total}' -X POST -H 'Content-Type: application/json' -d "$body" "$full_url")
  else
    seconds=$(curl -sS -o /dev/null -w '%{time_total}' "$full_url")
  fi

  awk -v sec="$seconds" 'BEGIN { printf "%.3f", sec * 1000 }'
}

collect_values() {
  local values_file="$1"
  local n="$2"
  local base_url="$3"
  local endpoint="$4"
  local method="$5"
  local body="${6:-}"

  : > "$values_file"
  for ((i = 1; i <= n; i += 1)); do
    request_time_ms "$base_url" "$endpoint" "$method" "$body" >>"$values_file"
    printf '\n' >>"$values_file"
  done
}

record_metric() {
  local endpoint="$1"
  local path_type="$2"
  local scenario="$3"
  local values_file="$4"

  local stats_json
  stats_json=$(perf_stats_json_from_values_file "$values_file")
  local timestamp
  timestamp=$(perf_iso8601)

  local json_line
  json_line=$(ENDPOINT="$endpoint" PATH_TYPE="$path_type" SCENARIO="$scenario" STATS="$stats_json" TS="$timestamp" bun -e '
    const stats = JSON.parse(process.env.STATS || "{}");
    const payload = {
      endpoint: process.env.ENDPOINT,
      pathType: process.env.PATH_TYPE,
      scenario: process.env.SCENARIO,
      n: Number(stats.n),
      minMs: Number(stats.minMs),
      avgMs: Number(stats.avgMs),
      p50Ms: Number(stats.p50Ms),
      p95Ms: Number(stats.p95Ms),
      maxMs: Number(stats.maxMs),
      timestamp: process.env.TS,
    };
    console.log(JSON.stringify(payload));
  ')

  perf_append_json_line "$out_file" "$json_line"
  echo "[measure-api-latency] $path_type $endpoint $scenario -> $stats_json"
}

measure_endpoint() {
  local endpoint="$1"
  local method="$2"
  local body="$3"

  local values_file="$tmp_dir/values.txt"

  collect_values "$values_file" 1 "$direct_base_url" "$endpoint" "$method" "$body"
  record_metric "$endpoint" "direct-cli-http" "cold" "$values_file"

  collect_values "$values_file" "$samples" "$direct_base_url" "$endpoint" "$method" "$body"
  record_metric "$endpoint" "direct-cli-http" "warm" "$values_file"

  collect_values "$values_file" 1 "$proxy_base_url" "$endpoint" "$method" "$body"
  record_metric "$endpoint" "next-proxy" "cold" "$values_file"

  collect_values "$values_file" "$samples" "$proxy_base_url" "$endpoint" "$method" "$body"
  record_metric "$endpoint" "next-proxy" "warm" "$values_file"
}

render_body=$(RENDER_FILE="$render_file" bun -e 'console.log(JSON.stringify({ filePath: process.env.RENDER_FILE }))')

measure_endpoint "/render" "POST" "$render_body"
measure_endpoint "/file-tree" "GET" ""

echo "[measure-api-latency] wrote $out_file"
