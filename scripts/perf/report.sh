#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

baseline_label="baseline"
current_label="current"
artifact_root="$SCRIPT_DIR/artifacts"
output_file=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --baseline-label)
      baseline_label="$2"
      shift 2
      ;;
    --current-label)
      current_label="$2"
      shift 2
      ;;
    --artifact-root)
      artifact_root="$2"
      shift 2
      ;;
    --output)
      output_file="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$output_file" ]]; then
  output_file="$artifact_root/$current_label/report.md"
fi

mkdir -p "$(dirname "$output_file")"

BASELINE_DIR="$artifact_root/$baseline_label" CURRENT_DIR="$artifact_root/$current_label" OUTPUT_FILE="$output_file" bun -e '
  import { existsSync, readFileSync, writeFileSync } from "node:fs";

  const baselineDir = process.env.BASELINE_DIR!;
  const currentDir = process.env.CURRENT_DIR!;
  const outputFile = process.env.OUTPUT_FILE!;

  function readNdjson(filePath: string): any[] {
    if (!existsSync(filePath)) return [];
    const raw = readFileSync(filePath, "utf8").trim();
    if (!raw) return [];
    return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  }

  function toDelta(current: number | undefined, baseline: number | undefined): string {
    if (current === undefined || baseline === undefined) return "n/a";
    const delta = current - baseline;
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(3)}`;
  }

  const baselineBuild = readNdjson(`${baselineDir}/build-metrics.ndjson`);
  const currentBuild = readNdjson(`${currentDir}/build-metrics.ndjson`);
  const baselineDev = readNdjson(`${baselineDir}/dev-route-metrics.ndjson`);
  const currentDev = readNdjson(`${currentDir}/dev-route-metrics.ndjson`);
  const baselineApi = readNdjson(`${baselineDir}/api-metrics.ndjson`);
  const currentApi = readNdjson(`${currentDir}/api-metrics.ndjson`);

  const lines: string[] = [];
  lines.push("# Performance Report");
  lines.push("");
  lines.push(`- baseline: ${baselineDir}`);
  lines.push(`- current: ${currentDir}`);
  lines.push(`- generatedAt: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("## Build Metrics (realSec)");
  lines.push("");
  lines.push("| Stage | Mode | Baseline | Current | Delta (current-baseline) |");
  lines.push("|---|---:|---:|---:|---:|");

  const buildKeys = new Set([
    ...baselineBuild.map((item) => `${item.stage}:${item.mode}`),
    ...currentBuild.map((item) => `${item.stage}:${item.mode}`),
  ]);

  for (const key of [...buildKeys].sort()) {
    const [stage, mode] = key.split(":");
    const base = baselineBuild.find((item) => `${item.stage}:${item.mode}` === key)?.realSec;
    const curr = currentBuild.find((item) => `${item.stage}:${item.mode}` === key)?.realSec;
    lines.push(`| ${stage} | ${mode} | ${base ?? "n/a"} | ${curr ?? "n/a"} | ${toDelta(curr, base)} |`);
  }

  lines.push("");
  lines.push("## Dev Route Metrics (requestTimeSec)");
  lines.push("");
  lines.push("| Route | Phase | Baseline | Current | Delta (current-baseline) |");
  lines.push("|---|---|---:|---:|---:|");

  const devKeys = new Set([
    ...baselineDev.map((item) => `${item.route}:${item.phase}`),
    ...currentDev.map((item) => `${item.route}:${item.phase}`),
  ]);

  for (const key of [...devKeys].sort()) {
    const [route, phase] = key.split(":");
    const base = baselineDev.find((item) => `${item.route}:${item.phase}` === key)?.requestTimeSec;
    const curr = currentDev.find((item) => `${item.route}:${item.phase}` === key)?.requestTimeSec;
    lines.push(`| ${route} | ${phase} | ${base ?? "n/a"} | ${curr ?? "n/a"} | ${toDelta(curr, base)} |`);
  }

  lines.push("");
  lines.push("## API Metrics (p95Ms)");
  lines.push("");
  lines.push("| Endpoint | Path | Scenario | Baseline | Current | Delta (current-baseline) |");
  lines.push("|---|---|---|---:|---:|---:|");

  const apiKeys = new Set([
    ...baselineApi.map((item) => `${item.endpoint}:${item.pathType}:${item.scenario}`),
    ...currentApi.map((item) => `${item.endpoint}:${item.pathType}:${item.scenario}`),
  ]);

  for (const key of [...apiKeys].sort()) {
    const [endpoint, pathType, scenario] = key.split(":");
    const base = baselineApi.find((item) => `${item.endpoint}:${item.pathType}:${item.scenario}` === key)?.p95Ms;
    const curr = currentApi.find((item) => `${item.endpoint}:${item.pathType}:${item.scenario}` === key)?.p95Ms;
    lines.push(`| ${endpoint} | ${pathType} | ${scenario} | ${base ?? "n/a"} | ${curr ?? "n/a"} | ${toDelta(curr, base)} |`);
  }

  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- 값이 `n/a`인 항목은 baseline 또는 current 측정이 누락된 상태입니다.");
  lines.push("- 음수 delta는 개선(시간 감소), 양수 delta는 회귀(시간 증가)를 의미합니다.");

  writeFileSync(outputFile, `${lines.join("\n")}\n`, "utf8");
  console.log(`[perf-report] wrote ${outputFile}`);
'
