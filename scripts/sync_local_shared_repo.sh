#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="${1:-shared-data}"
DEST_DIR="${2:-../shared-horses-data}"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "source dir not found: $SRC_DIR"
  exit 1
fi

mkdir -p "$DEST_DIR"
rsync -a --delete --exclude '.git/' "$SRC_DIR/" "$DEST_DIR/"

echo "synced $SRC_DIR -> $DEST_DIR"
