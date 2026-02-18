#!/usr/bin/env bash
set -euo pipefail

REMOTE="${1:-}"
BRANCH="${2:-main}"
PREFIX="shared-data"
TMP_BRANCH="codex/shared-horses-data"

if [[ -z "$REMOTE" ]]; then
  echo "usage: scripts/publish_shared_subtree.sh <remote-url-or-name> [branch]"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "working tree is dirty. commit or stash first."
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/${TMP_BRANCH}"; then
  git branch -D "${TMP_BRANCH}" >/dev/null
fi

git subtree split --prefix "${PREFIX}" -b "${TMP_BRANCH}" >/dev/null

git push "${REMOTE}" "${TMP_BRANCH}:${BRANCH}"

git branch -D "${TMP_BRANCH}" >/dev/null

echo "published ${PREFIX} -> ${REMOTE} (${BRANCH})"
