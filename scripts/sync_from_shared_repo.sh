#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Canonical source repo (authoritative)
SRC_DIR="${1:-$ROOT_DIR/../shared-horses-data}"
APP_SHARED_DIR="${2:-$ROOT_DIR/shared-data}"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "source shared repo not found: $SRC_DIR"
  exit 1
fi

if [[ ! -f "$SRC_DIR/horses.json" ]]; then
  echo "source horses.json not found: $SRC_DIR/horses.json"
  exit 1
fi

mkdir -p "$APP_SHARED_DIR"
rsync -a --delete --exclude '.git/' "$SRC_DIR/" "$APP_SHARED_DIR/"

echo "synced canonical -> my-horse/shared-data"

node "$ROOT_DIR/scripts/verify_horses_sync.mjs" \
  --shared "$APP_SHARED_DIR/horses.json"

echo "done"
echo "  source : $SRC_DIR/horses.json"
echo "  shared : $APP_SHARED_DIR/horses.json"
