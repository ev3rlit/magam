#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

file_path="examples/overview.tsx"
direct_base_url="http://localhost:3002"
proxy_base_url="http://localhost:3000/api"
runs=3

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file-path)
      file_path="$2"
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
    --runs)
      runs="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if ! [[ "$runs" =~ ^[0-9]+$ ]] || [[ "$runs" -lt 1 ]]; then
  echo "--runs must be a positive integer" >&2
  exit 1
fi

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

payload=$(TARGET_FILE="$file_path" bun -e 'console.log(JSON.stringify({ filePath: process.env.TARGET_FILE }))')

for ((i = 1; i <= runs; i += 1)); do
  direct_file="$tmp_dir/direct-${i}.json"
  proxy_file="$tmp_dir/proxy-${i}.json"

  curl -sS -X POST -H 'Content-Type: application/json' -d "$payload" "${direct_base_url%/}/render" >"$direct_file"
  curl -sS -X POST -H 'Content-Type: application/json' -d "$payload" "${proxy_base_url%/}/render" >"$proxy_file"

  DIRECT_FILE="$direct_file" PROXY_FILE="$proxy_file" RUN_ID="$i" bun -e '
    import { readFileSync } from "node:fs";

    const direct = JSON.parse(readFileSync(process.env.DIRECT_FILE!, "utf8"));
    const proxy = JSON.parse(readFileSync(process.env.PROXY_FILE!, "utf8"));

    const renderableNodeTypes = new Set([
      "graph-node",
      "graph-sticky",
      "graph-shape",
      "graph-text",
      "graph-image",
      "graph-sequence",
      "graph-washi-tape",
      "graph-sticker",
    ]);

    function snapshot(response: any) {
      if (response?.error) {
        throw new Error(`Render response error: ${response.error}`);
      }

      if (!Array.isArray(response?.graph?.children)) {
        throw new Error("Render response missing graph.children array");
      }

      const nodes: string[] = [];
      const edges: string[] = [];
      let missingSourceMeta = 0;

      const visit = (node: any) => {
        if (!node || typeof node !== "object") return;

        if (node.type === "graph-edge") {
          const from = node.props?.from ?? "";
          const to = node.props?.to ?? "";
          const label = node.props?.label ?? "";
          edges.push(`${from}->${to}:${label}`);
        }

        if (renderableNodeTypes.has(node.type)) {
          const id = node.props?.id ?? "";
          const sourceMeta = node.props?.sourceMeta;
          if (!sourceMeta || typeof sourceMeta !== "object") {
            missingSourceMeta += 1;
          }
          nodes.push(`${node.type}|${id}|${sourceMeta?.sourceId ?? ""}|${sourceMeta?.kind ?? ""}|${sourceMeta?.scopeId ?? ""}`);
        }

        if (Array.isArray(node.children)) {
          node.children.forEach(visit);
        }
      };

      const rootChildren = response.graph.children as any[];
      rootChildren.forEach(visit);

      nodes.sort();
      edges.sort();

      return {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodes,
        edges,
        sourceVersion: response?.sourceVersion ?? null,
        missingSourceMeta,
      };
    }

    const directSnapshot = snapshot(direct);
    const proxySnapshot = snapshot(proxy);

    const same = JSON.stringify(directSnapshot) === JSON.stringify(proxySnapshot);
    if (!same) {
      console.error("[verify-render-consistency] mismatch", {
        run: process.env.RUN_ID,
        direct: directSnapshot,
        proxy: proxySnapshot,
      });
      process.exit(1);
    }

    console.log(`[verify-render-consistency] run=${process.env.RUN_ID} ok nodes=${directSnapshot.nodeCount} edges=${directSnapshot.edgeCount}`);
  '
done

echo "[verify-render-consistency] all checks passed"
