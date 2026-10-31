#!/usr/bin/env bash
# Quality gate. Run from anywhere: agent-rules/scripts/gate.sh
# Project-specific settings (contracts, build steps) live in agent-rules/project.sh.
#
# Exit codes: 0 — every step passed; 1 — at least one step failed;
#             2 — no failures, but at least one step was skipped or not run (gate not complete).
# Environment: BUILD=0 skips the build step explicitly (it is still reported as SKIP).
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPTS="$ROOT/agent-rules/scripts"
# shellcheck source=../project.sh
. "$ROOT/agent-rules/project.sh"
LOGDIR="$(mktemp -d "${TMPDIR:-/tmp}/${PROJECT_SLUG:-project}-gate.XXXXXX")"
REDOCLY="@redocly/cli@2.62.1"
RESULTS=()
FAILED=0
SKIPPED=0

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then G=$'\e[32m'; R=$'\e[31m'; Y=$'\e[33m'; N=$'\e[0m'; else G=; R=; Y=; N=; fi

record() { # name status note
  RESULTS+=("$2|$1|$3")
  case "$2" in FAIL) FAILED=$((FAILED + 1)) ;; SKIP) SKIPPED=$((SKIPPED + 1)) ;; esac
}

run_step() { # name, command... ; script exit 3 means "tool missing" → SKIP
  local name="$1"; shift
  local log="$LOGDIR/$(echo "$name" | tr ' /' '__').log"
  echo "→ $name"
  (cd "$ROOT" && "$@") >"$log" 2>&1
  local code=$?
  if [ $code -eq 0 ]; then record "$name" PASS ""
  elif [ $code -eq 3 ]; then record "$name" SKIP "$(tail -1 "$log")"
  else record "$name" FAIL "$log"
  fi
}

skip_step() { echo "→ $1"; record "$1" SKIP "$2"; }
na_step() { echo "→ $1"; record "$1" N/A "$2"; }  # does not apply to this project; not a skip

# ---------- agent setup ----------
run_step "agent / stack" python3 "$SCRIPTS/check_setup.py" --stack
run_step "agent / managed files" python3 "$SCRIPTS/check_setup.py" --managed
run_step "agent / rule index" python3 "$SCRIPTS/gen_rule_index.py" --check
run_step "agent / .cursorrules" python3 "$SCRIPTS/gen_cursorrules.py" --check

# ---------- specifications ----------
run_step "specs / registry, labels, links" python3 "$SCRIPTS/check_specs.py"
run_step "specs / spec index" python3 "$SCRIPTS/gen_spec_index.py" --check
run_step "specs / project review" python3 "$SCRIPTS/gen_project_review.py" --check
run_step "specs / freshness" bash "$SCRIPTS/spec_freshness.sh" --gate

# ---------- contracts ----------
# CONTRACTS holds paths or glob patterns relative to the repository root; patterns without a match are ignored.
CONTRACT_FILES=()
set -f; PATTERNS=(); [ "${CONTRACTS:-}" != "none" ] && PATTERNS=(${CONTRACTS:-}); set +f
shopt -s nullglob
for pattern in "${PATTERNS[@]+"${PATTERNS[@]}"}"; do
  for f in "$ROOT"/$pattern; do [ -f "$f" ] && CONTRACT_FILES+=("${f#"$ROOT"/}"); done
done
shopt -u nullglob

if [ "${CONTRACTS:-}" = "none" ]; then
  na_step "contracts / lint" "the project owns no OpenAPI contract (CONTRACTS=none in agent-rules/project.sh)"
elif [ ${#CONTRACT_FILES[@]} -eq 0 ]; then
  skip_step "contracts / lint" "no contract files found for CONTRACTS=\"${CONTRACTS:-}\" (agent-rules/project.sh)"
elif ! command -v npx >/dev/null 2>&1; then
  skip_step "contracts / lint" "npx is not installed (needed for $REDOCLY)"
elif ! REDOCLY_PROBE="$(cd "$ROOT" && npx --yes "$REDOCLY" --version 2>&1)"; then
  # npx could not fetch or start the linter (offline, registry unavailable): a missing tool, not a lint failure.
  skip_step "contracts / lint" "could not run $REDOCLY through npx: $(printf '%s\n' "$REDOCLY_PROBE" | grep -m1 . )"
else
  for c in "${CONTRACT_FILES[@]}"; do
    run_step "contracts / $(basename "$c")" npx --yes "$REDOCLY" lint --config agent-rules/redocly.yaml "$c"
  done
fi

# ---------- build and tests ----------
# BUILD_STEPS: one "name|command" per line, run in order; after a failed step the later ones are not
# run (they usually depend on it). Without BUILD_STEPS the single BUILD_CMD is used.
BUILD_LINES=()
if [ -n "${BUILD_STEPS:-}" ]; then
  while IFS= read -r line; do
    line="${line#"${line%%[![:space:]]*}"}"
    [ -n "$line" ] && [ "${line#\#}" = "$line" ] && BUILD_LINES+=("$line")
  done <<< "$BUILD_STEPS"
elif [ -n "${BUILD_CMD:-}" ]; then
  BUILD_LINES+=("${BUILD_NAME:-build / tests}|$BUILD_CMD")
fi

if [ ${#BUILD_LINES[@]} -eq 0 ]; then
  skip_step "${BUILD_NAME:-build / tests}" "no build steps configured (BUILD_STEPS or BUILD_CMD in agent-rules/project.sh)"
elif [ "${BUILD:-1}" = "0" ]; then
  for l in "${BUILD_LINES[@]}"; do skip_step "build / ${l%%|*}" "BUILD=0 was set"; done
elif ! PRECHECK="$(cd "$ROOT" && build_precheck 2>&1)"; then
  for l in "${BUILD_LINES[@]}"; do skip_step "build / ${l%%|*}" "${PRECHECK:-environment check failed}"; done
else
  BUILD_FAILED=""
  for l in "${BUILD_LINES[@]}"; do
    name="build / ${l%%|*}"; cmd="${l#*|}"
    if [ -n "$BUILD_FAILED" ]; then skip_step "$name" "not run: $BUILD_FAILED failed"; continue; fi
    before=$FAILED
    run_step "$name" bash -c "$cmd"
    [ $FAILED -gt $before ] && BUILD_FAILED="$name"
  done
fi

# ---------- summary ----------
echo
echo "Gate summary"
for r in "${RESULTS[@]}"; do
  status="${r%%|*}"; rest="${r#*|}"; name="${rest%%|*}"; note="${rest#*|}"
  case "$status" in
    PASS) printf '  %sPASS%s  %s\n' "$G" "$N" "$name" ;;
    SKIP) printf '  %sSKIP%s  %s — %s\n' "$Y" "$N" "$name" "$note" ;;
    N/A)  printf '  N/A   %s — %s\n' "$name" "$note" ;;
    FAIL) printf '  %sFAIL%s  %s\n' "$R" "$N" "$name" ;;
  esac
done
for r in "${RESULTS[@]}"; do
  status="${r%%|*}"; rest="${r#*|}"; name="${rest%%|*}"; log="${rest#*|}"
  if [ "$status" = "FAIL" ]; then
    echo; echo "---- $name (last 80 lines of $log) ----"; tail -80 "$log"
  fi
done
echo
if [ $FAILED -gt 0 ]; then
  echo "${R}Gate: failed${N} — $FAILED step(s) failed, $SKIPPED skipped. Logs: $LOGDIR"; exit 1
elif [ $SKIPPED -gt 0 ]; then
  echo "${Y}Gate: not complete${N} — $SKIPPED step(s) not run. A skipped step is not a passed step. Logs: $LOGDIR"; exit 2
fi
echo "${G}Gate: passed${N}. Logs: $LOGDIR"
exit 0
