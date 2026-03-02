#!/usr/bin/env bash

set -euo pipefail

direct_base_url="http://localhost:3002"
proxy_base_url="http://localhost:3000/api"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --direct-base-url)
      direct_base_url="$2"
      shift 2
      ;;
    --proxy-base-url)
      proxy_base_url="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

direct_file="$tmp_dir/direct-tree.json"
proxy_file="$tmp_dir/proxy-tree.json"

curl -sS "${direct_base_url%/}/file-tree" >"$direct_file"
curl -sS "${proxy_base_url%/}/file-tree" >"$proxy_file"

DIRECT_FILE="$direct_file" PROXY_FILE="$proxy_file" bun -e '
  import { readFileSync } from "node:fs";

  const ignoredPatterns = ["/node_modules/", "/.git/", "/dist/", "/build/"];

  const direct = JSON.parse(readFileSync(process.env.DIRECT_FILE!, "utf8"));
  const proxy = JSON.parse(readFileSync(process.env.PROXY_FILE!, "utf8"));

  function flatten(node: any, list: string[] = []): string[] {
    if (!node) return list;
    if (node.path) {
      list.push(`${node.type}:${node.path}`);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach((child: any) => flatten(child, list));
    }
    return list;
  }

  function validateTree(node: any, parentPath = ""): string[] {
    const errors: string[] = [];

    if (!node || typeof node !== "object") {
      errors.push("Invalid node object encountered.");
      return errors;
    }

    if (typeof node.name !== "string" || typeof node.type !== "string") {
      errors.push(`Node missing required fields: ${JSON.stringify(node)}`);
      return errors;
    }

    if (node.path && typeof node.path === "string") {
      if (parentPath && !node.path.startsWith(parentPath)) {
        errors.push(`Path hierarchy mismatch: parent=${parentPath} child=${node.path}`);
      }

      for (const pattern of ignoredPatterns) {
        if (node.path.includes(pattern)) {
          errors.push(`Ignored path leaked into tree: ${node.path}`);
        }
      }
    }

    const children = Array.isArray(node.children) ? node.children : [];
    for (let i = 0; i < children.length - 1; i += 1) {
      const left = children[i];
      const right = children[i + 1];

      if (left.type !== right.type && left.type !== "directory") {
        errors.push(`Sort invariant violated at ${node.path || "root"}: files listed before directories.`);
      }

      if (left.type === right.type && String(left.name).localeCompare(String(right.name)) > 0) {
        errors.push(`Alphabetical sort invariant violated at ${node.path || "root"}: ${left.name} > ${right.name}`);
      }
    }

    for (const child of children) {
      errors.push(...validateTree(child, node.path || ""));
    }

    return errors;
  }

  const directTree = direct?.tree;
  const proxyTree = proxy?.tree;

  if (!directTree || !proxyTree) {
    console.error("[verify-filetree-consistency] Missing tree payload", {
      direct: Boolean(directTree),
      proxy: Boolean(proxyTree),
    });
    process.exit(1);
  }

  const directFlat = flatten(directTree).sort();
  const proxyFlat = flatten(proxyTree).sort();

  if (JSON.stringify(directFlat) !== JSON.stringify(proxyFlat)) {
    console.error("[verify-filetree-consistency] direct/proxy tree mismatch", {
      directCount: directFlat.length,
      proxyCount: proxyFlat.length,
    });
    process.exit(1);
  }

  const errors = [
    ...validateTree(directTree),
    ...validateTree(proxyTree),
  ];

  if (errors.length > 0) {
    console.error("[verify-filetree-consistency] invariants failed", errors.slice(0, 20));
    process.exit(1);
  }

  console.log(`[verify-filetree-consistency] ok entries=${directFlat.length}`);
'

echo "[verify-filetree-consistency] all checks passed"
