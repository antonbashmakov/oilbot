# Project settings for the quality gate and the Claude Code Stop hook (stack: nextjs).
# Sourced by agent-rules/scripts/gate.sh and spec_freshness.sh. Project-owned: edit it freely; the
# boilerplate installer never overwrites it.

# Short name of the project, used for temporary log directories.
PROJECT_SLUG="oilbot"

# Package manager: yarn (yarn.lock in every package, node_modules installed by yarn). The
# package-lock.json files next to them are not updated (rule 104.1, Q-02).
PKG="yarn"
# Node major version: engines.node of functions/package.json.
NODE_MAJOR="22"

# Firebase layout (rules 107, 201): functions/ plus the Next.js apps crm/ and twa/ and the Telegram
# bot package bot/ next to firebase.json.
FIREBASE=""
[ -f "${ROOT:-.}/firebase.json" ] && [ -d "${ROOT:-.}/functions" ] && FIREBASE="1"
# Project id of the emulators. The functions tests hard-code "test-project" (functions/jest.setup.js,
# functions/src/test/setup.ts); moving to demo-oilbot is a task of its own (rule 201.3).
EMULATOR_PROJECT="test-project"

# Paths that count as code: a change there without any change under specifications/ fails the gate
# and triggers the Stop hook (rule 016.8). Paths that do not exist are ignored.
CODE_PATHS="functions/src functions/resources functions/package.json
crm/src crm/openapi crm/package.json crm/next.config.ts
twa/src twa/openapi twa/messages twa/i18n twa/package.json twa/next.config.ts
bot/src bot/resources bot/package.json
firebase.json firestore.indexes.json package.json"

# Paths inside CODE_PATHS that never count as a code change, for example marketing copy sections.
SPEC_EXEMPT_PATHS=""

# OpenAPI contracts linted by Redocly. The backend contract is ours; the copies in crm/, twa/ and
# bot/ are consumer copies and are not linted (rule 108.1).
CONTRACTS="functions/resources/openapi/api.yml functions/resources/openapi/models.yml"

# Build and test steps, one "name|command" per line, in order (rule 111.1, 111.8).
BUILD_STEPS="
functions:types|cd functions && npx tsc --noEmit
functions:lint|cd functions && npx eslint --ext .ts src
functions:build|cd functions && $PKG run build
functions:tests|cd functions && firebase emulators:exec --project $EMULATOR_PROJECT --only firestore,functions '$PKG test'
crm:types|cd crm && npx tsc --noEmit
crm:lint|cd crm && $PKG run lint
crm:build|cd crm && $PKG run build
twa:types|cd twa && npx tsc --noEmit
twa:lint|cd twa && $PKG run lint
twa:build|cd twa && $PKG run build
bot:build|cd bot && $PKG run build
"

build_precheck() {
  command -v node >/dev/null 2>&1 || { echo "node not found in PATH"; return 1; }
  command -v "$PKG" >/dev/null 2>&1 || { echo "$PKG not found in PATH"; return 1; }
  node -v | grep -q "^v${NODE_MAJOR}\." || { echo "node $(node -v) found; functions use Node ${NODE_MAJOR}"; return 1; }
  for d in functions crm twa bot; do
    [ -f "$d/package.json" ] && [ ! -d "$d/node_modules" ] && { echo "$d/node_modules missing: run the install command from rule 104"; return 1; }
  done
  command -v firebase >/dev/null 2>&1 || { echo "firebase CLI not found in PATH: install firebase-tools globally until it is pinned (rule 201.4)"; return 1; }
  command -v java >/dev/null 2>&1 || { echo "java not found in PATH: the Firestore emulator needs it (rule 107.12)"; return 1; }
}
