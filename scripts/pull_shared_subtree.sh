#!/usr/bin/env bash
set -euo pipefail

REMOTE="${1:-}"
BRANCH="${2:-main}"
PREFIX="shared-data"

if [[ -z "$REMOTE" ]]; then
  echo "usage: scripts/pull_shared_subtree.sh <remote-url-or-name> [branch]"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "working tree is dirty. commit or stash first."
  exit 1
fi

git subtree pull --prefix "${PREFIX}" "${REMOTE}" "${BRANCH}" --squash

echo "pulled ${PREFIX} <- ${REMOTE} (${BRANCH})"
