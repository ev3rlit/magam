#!/usr/bin/env bash

set -euo pipefail

perf_now_ms() {
  local now
  now=$(date +%s%3N 2>/dev/null || true)
  if [[ "$now" =~ ^[0-9]+$ ]]; then
    printf '%s' "$now"
    return
  fi

  python3 - <<'PY'
import time
print(int(time.time() * 1000))
PY
}

perf_iso8601() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

perf_require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[perf] missing required command: $cmd" >&2
    return 1
  fi
}

perf_ensure_dir() {
  local dir="$1"
  mkdir -p "$dir"
}

perf_run_timed_command() {
  local start_ms end_ms status
  start_ms=$(perf_now_ms)
  set +e
  "$@" >&2
  status=$?
  set -e
  end_ms=$(perf_now_ms)
  printf '%s,%s\n' "$((end_ms - start_ms))" "$status"
}

perf_append_json_line() {
  local target_file="$1"
  local json_line="$2"
  printf '%s\n' "$json_line" >>"$target_file"
}

perf_stats_json_from_values_file() {
  local values_file="$1"
  sort -n "$values_file" | awk '
    {
      values[NR] = $1;
      sum += $1;
    }
    END {
      if (NR == 0) {
        exit 1;
      }

      n = NR;
      p50_index = int((0.50 * (n - 1)) + 1);
      p95_index = int((0.95 * (n - 1)) + 1);
      avg = sum / n;

      printf "{\"n\":%d,\"minMs\":%.3f,\"avgMs\":%.3f,\"p50Ms\":%.3f,\"p95Ms\":%.3f,\"maxMs\":%.3f}", n, values[1], avg, values[p50_index], values[p95_index], values[n];
    }
  '
}

perf_require_bun() {
  perf_require_command bun
}
