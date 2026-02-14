#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/publish.sh [--dry-run]
#
# Builds and publishes all @graphwrite/* packages in dependency order.
# workspace:* references are replaced with actual versions before publish
# and restored afterwards.

DRY_RUN=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
  echo "=== DRY RUN MODE ==="
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGES=("shared" "core" "runtime" "cli")

# --- Build all packages in order ---
echo "=== Building all packages ==="
for pkg in "${PACKAGES[@]}"; do
  echo "-> Building @graphwrite/$pkg"
  (cd "$ROOT/libs/$pkg" && bun run build)
done

# --- Publish each package ---
echo ""
echo "=== Publishing packages ==="
for pkg in "${PACKAGES[@]}"; do
  PKG_DIR="$ROOT/libs/$pkg"
  PKG_JSON="$PKG_DIR/package.json"

  # Replace workspace:* with actual versions before publish
  if grep -q '"workspace:\*"' "$PKG_JSON"; then
    echo "-> Replacing workspace:* references in @graphwrite/$pkg"
    cp "$PKG_JSON" "$PKG_JSON.bak"

    # For each workspace dependency, resolve its version
    for dep in "${PACKAGES[@]}"; do
      DEP_VERSION=$(node -p "require('$ROOT/libs/$dep/package.json').version")
      # Replace "workspace:*" for this specific dep
      sed -i '' "s|\"@graphwrite/$dep\": \"workspace:\\*\"|\"@graphwrite/$dep\": \"^$DEP_VERSION\"|g" "$PKG_JSON"
    done
  fi

  echo "-> Publishing @graphwrite/$pkg"
  (cd "$PKG_DIR" && npm publish --access public $DRY_RUN) || true

  # Restore original package.json
  if [[ -f "$PKG_JSON.bak" ]]; then
    mv "$PKG_JSON.bak" "$PKG_JSON"
    echo "   Restored package.json"
  fi
done

echo ""
echo "=== Done ==="
