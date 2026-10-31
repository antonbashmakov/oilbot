#!/usr/bin/env bash
# Detects code changes in the working tree without any change under specifications/.
#
#   spec_freshness.sh --gate   exit 1 when code changed without specifications, 3 when git is missing
#                              (used by gate.sh)
#   spec_freshness.sh          Claude Code Stop hook: asks the agent once to update specifications
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=../project.sh
. "$ROOT/agent-rules/project.sh"
MODE="${1:-hook}"

if [ "$MODE" = "hook" ]; then
  INPUT="$(cat || true)"
  # Block only once in a row: the second stop attempt passes.
  if printf '%s' "$INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
    exit 0
  fi
fi

if ! command -v git >/dev/null 2>&1; then
  [ "$MODE" = "--gate" ] && { echo "SKIP: git not found"; exit 3; }
  exit 0
fi
# --untracked-files=all lists files inside untracked directories, so .DS_Store files (created by
# Finder) can be filtered out on both sides and never count as a code or specification change.
changes() { git -C "$ROOT" status --porcelain --untracked-files=all -- "$@" 2>/dev/null | grep -v '\.DS_Store"\{0,1\}$' || true; }
# CODE_PATHS and SPEC_EXEMPT_PATHS are space-separated lists; exempt paths (for example copy or static
# assets) never count as a code change.
CODE_CHANGES=""
if [ -n "${CODE_PATHS:-}" ]; then
  set -f
  # shellcheck disable=SC2206
  PATHSPECS=(${CODE_PATHS})
  for p in ${SPEC_EXEMPT_PATHS:-}; do PATHSPECS+=(":(exclude)$p"); done
  set +f
  CODE_CHANGES="$(changes "${PATHSPECS[@]}")"
fi
SPEC_CHANGES="$(changes specifications)"

if [ -z "$CODE_CHANGES" ] || [ -n "$SPEC_CHANGES" ]; then
  [ "$MODE" = "--gate" ] && echo "Specifications freshness: OK"
  exit 0
fi

FILES="$(printf '%s\n' "$CODE_CHANGES" | awk '{print $2}' | head -10 | tr '\n' ' ')"
MSG="Code changed (${FILES}) but nothing under specifications/ changed. Per agent-rules/rules/016-specifications-upkeep.md update in the same task: the work log specifications/logs/YYYY-MM-DD-<topic>.md, the task status in FEATURE_REGISTRY.yaml, the spec, TEST_COVERAGE.yaml and the test document, CHANGELOG, BUGS and questions as applicable. If no specification change is needed, write the reason in the work log."

if [ "$MODE" = "--gate" ]; then
  echo "FAIL: $MSG"
  exit 1
fi

# Stop hook: block once and give the agent the reason.
python3 -c 'import json,sys; print(json.dumps({"decision": "block", "reason": sys.argv[1]}))' "$MSG"
exit 0
