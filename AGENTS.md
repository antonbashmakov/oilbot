# AGENTS.md

Entry point for AI coding agents (Claude Code, Codex, Cursor) working in this repository. Detailed
rules live in `agent-rules/rules/`, the project knowledge base in `specifications/`. `CLAUDE.md`
imports this file for Claude Code.

## Project

`oilbot` is the backend, staff CRM and customer Telegram Mini App of "Posebestoimosti", a
delivery-based shop: customers order, pay and chat (now with an AI agent that picks motor oil for
their car), staff run deliveries, orders, payments and broadcasts.

Stack: TypeScript 5.9 on Node.js 22; Firebase Cloud Functions (Express, firebase-functions 5) with
Firestore; Next.js 16 / React 19 apps (`crm/` with Chakra UI, `twa/` with Tailwind CSS); T-Bank
payments, Telegram and DeepSeek integrations; yarn. Deployed manually with the Firebase CLI to
Firebase Hosting and Cloud Functions; no CI. Details and fixed versions:
`agent-rules/rules/104-tech-stack.md`; layout differences from the stack rules:
`agent-rules/rules/201-repository-layout.md`.

## Status (2026-10-31) — read before any task

- **Branches.** Active work is on `master` (the AI chat in the Mini App); the remote default branch
  is `create-account-sms`; other branches (`connect-new-ui-to-serve`, `sbp-implementation`,
  `vk-migration`, `fix-cart-items-bug`, `master-backup-2026-03-22`) are not touched by agents. Never
  switch or merge branches without the developer's word.
- **Known state.** On `master` the private API serves only the chat (`GET`/`POST
  /private/customers/{customerId}/chats/{chatId}/messages`), protected by the customer token that
  `POST /public/auth` issues for Telegram init data (TWA-01, not deployed yet);
  orders, deliveries, payments and subscriptions are served by the admin, agent, public and webhook
  APIs and covered by Jest integration tests. The API contract copies in the apps have drifted
  (Q-03). Nothing was run end to end while adopting the agent setup. Known defects are in
  `specifications/bugs/BUGS.md`. Do not assume existing code is correct: verify against the
  specifications.
- **Environment.** Node.js 22, yarn 1, Java 21 and the `firebase` CLI for the emulators; secrets in
  the uncommitted `functions/.env` (T-Bank, DeepSeek) and `twa/.env.local`. Tests run on the
  emulators with project `test-project` (rule 201.3). See `agent-rules/rules/111-testing.md`.

## Repository layout

| Path | What it is |
|---|---|
| `functions/` | Cloud Functions backend: `src/controllers/` (Express apps per audience, Firestore and scheduled triggers), `src/services/` (data access, integrations, outbox processors in `events/`), `src/prompts/` (AI prompts), `src/test/` (Jest unit and integration tests), `seed-data/` (emulator export) |
| `functions/resources/openapi/` | Backend API contract (`api.yml`, `models.yml`), ours |
| `crm/` | Staff Next.js app: deliveries, orders, pickings, messages, broadcasts; Storybook; contract copy in `crm/openapi/` |
| `twa/` | Customer Telegram Mini App (Next.js): AI chat; contract copy in `twa/openapi/`; also a git repository of its own (rule 201.6) |
| `bot/` | Telegram bot prototype (Node.js, long polling); contract copy in `bot/resources/openapi/` |
| `firebase.json`, `.firebaserc`, `firestore.indexes.json` | Firebase functions, hosting targets `crm` and `twa`, emulators; project aliases; indexes |
| `mock/` | Sample T-Bank response |
| `agent-rules/` | Agent rules by layer (core, stack, project), project settings (`project.sh`), gate and helper scripts, review prompt template, `boilerplate.lock` and `boilerplate.manifest` |
| `.cursorrules` | Generated copy of `AGENTS.md` and the rules for Cursor and pipelines; do not edit |
| `specifications/` | Source of truth and knowledge base: requirements, task registry, specs, questions, ADRs, tests, logs, bugs |
| `specifications/PROJECT_REVIEW.html` | Generated project review page: tasks, statuses, readiness, questions (rule 016.12) |
| `.claude/` | Claude Code hooks (`settings.json`) and skills (`skills/`) |

<!-- ai-ready-boilerplate:core:begin — managed by ai-ready-boilerplate; do not edit here, change it upstream -->
## Stack check — before any task

Read `agent-rules/boilerplate.lock`. If it is missing or its `stack=` line is empty, the stack
rules (`1xx`) are not installed: **do not write code**. Suggest a stack from the repository
(`package.json` or `ui/package.json` with `next`, or `firebase.json` with `functions/` → `nextjs`), **ask the
developer to confirm or choose**, and install it with the `setup-stack` skill
(`.claude/skills/setup-stack/SKILL.md`; other agents follow the same steps). Never pick a stack
without the developer's answer.

## Rule layers

| Layer | Numbers | Owned by | Changed in |
|---|---|---|---|
| Core | `0xx` | ai-ready-boilerplate | the boilerplate repository, never here |
| Stack | `1xx` | ai-ready-boilerplate (`stacks/<stack>/`) | the boilerplate repository, never here |
| Project | `001`, `104`, `115`, `2xx` | this repository | here |

Files the boilerplate manages are listed in `agent-rules/boilerplate.manifest`; the gate fails when
one of them is edited locally. A project rule (`2xx`) overrides a core or stack rule only when it
names the rule it overrides ("overrides 111.4: …"); otherwise the stricter rule applies. Details:
`agent-rules/rules/019-rule-layers-and-updates.md`.

## Source of truth

`specifications/` is the source of truth. Before implementing anything, read:

1. `specifications/README.md` — what lives where.
2. `specifications/features/FEATURE_REGISTRY.yaml` — the task, its acceptance criteria and status.
3. The task spec, found through `specifications/features/SPEC_INDEX.md`.
4. `specifications/product/PRD.md` and the original task text in `specifications/product/source-tasks/`.
5. `specifications/architecture/` (system overview and ADRs), `specifications/integrations/`.
6. `specifications/questions/OPEN_QUESTIONS.md`, `specifications/bugs/BUGS.md`, recent `specifications/logs/`.

Do not reconstruct product intent from code alone. If code and specifications disagree, stop and
report the mismatch. If a requirement is missing or ambiguous, add a question `Q-NN` with the
behaviour to use until it is answered — do not invent product behaviour.

## Workflow (details: `agent-rules/rules/003-workflow.md`)

1. Sync the repository (`agent-rules/rules/013-git-and-sync.md`).
2. Find the task in the registry; read its spec, ADRs, questions.
3. Write the plan into a work log `specifications/logs/YYYY-MM-DD-<topic>.md` before coding.
4. If the change touches an API contract, change the contract first as the stack rules say.
5. Implement code and tests following the stack rules (`1xx`) and the project rules (`2xx`).
6. In the same task, update specifications: spec, registry, test document, `TEST_COVERAGE.yaml`,
   changelog, bugs, questions, log (`agent-rules/rules/016-specifications-upkeep.md`); then regenerate
   the project review page `python3 agent-rules/scripts/gen_project_review.py` (skill `project-review`).
7. Run the gate `agent-rules/scripts/gate.sh`. A skipped step is not a passed step.
8. Set the task to `code_review`, give the developer a summary and a ready prompt for a separate review
   session (`agent-rules/rules/012-code-review.md`, template `agent-rules/prompts/code-review.md`).

## Status model

| Code | Label | Who sets it |
|---|---|---|
| `planned` | Not started | — |
| `in_progress` | In progress | agent or developer |
| `blocked` | Blocked (any step, with a reason) | agent or developer |
| `code_review` | Code review: code done, not reviewed yet | agent or developer |
| `review_fixes` | Review fixes in progress | agent or developer |
| `ready_for_review` | Ready for review: fixes done, gate passed | agent or developer |
| `ready_for_test` | Ready for test (RFT) | **developer only** |
| `done` | Done | **developer only** |

## Quality gate

`agent-rules/scripts/gate.sh` runs the agent setup checks (stack installed, managed files unchanged,
rule index and `.cursorrules` current), specification checks (including the freshness of
`specifications/PROJECT_REVIEW.html`), the contract linter and the project's build and test steps
(configured in `agent-rules/project.sh`). Exit code 0 only when every step passed; 1 when a step
failed; 2 when a step was skipped or not run. Report the gate as "Gate: not complete — <step> not
run" when anything was skipped; never call such a gate green. Details:
`agent-rules/rules/011-quality-gate.md`.

## Git

Commit, push, merge, rebase, reset or switch branches only on the developer's explicit word. Work on
a tracker task goes to one branch named after the task, the same in every repository you change, for
example `CU-869fkhfxq_Title-Add-API-Pre-check-for-Partner-Customer-Eligibility_Anton-Bashmakov`
(rule 013.12). Commit messages carry the registry task ID and, if there is one, the tracker task ID.
Details: `agent-rules/rules/013-git-and-sync.md`.

## Forbidden without confirmation

Deleting directories or files, `git reset --hard`, force push, changing or removing applied database
migrations, clearing a database, changing deployment, CI or production configuration (the project's
list: `agent-rules/rules/115-protected-files.md`), calling production systems of external partners,
writing to the task tracker. Details: `agent-rules/rules/015-destructive-actions.md`.
<!-- ai-ready-boilerplate:core:end -->

## Rules by area — read the file for the area you touch

<!-- ai-ready-boilerplate:rules:begin — generated by agent-rules/scripts/gen_rule_index.py -->
| File | Layer | Area |
|---|---|---|
| `agent-rules/rules/001-project-context.md` | project | Project context |
| `agent-rules/rules/002-source-of-truth.md` | core | Source of truth |
| `agent-rules/rules/003-workflow.md` | core | Task workflow and statuses |
| `agent-rules/rules/004-dependencies-and-configuration.md` | core | Dependencies and configuration |
| `agent-rules/rules/005-change-principles.md` | core | Change principles |
| `agent-rules/rules/009-integrations.md` | core | External systems: conclusions only from real responses |
| `agent-rules/rules/010-security-personal-data.md` | core | Security and personal data |
| `agent-rules/rules/011-quality-gate.md` | core | Quality gate and evidence |
| `agent-rules/rules/012-code-review.md` | core | Code review |
| `agent-rules/rules/013-git-and-sync.md` | core | Git and repository sync |
| `agent-rules/rules/014-parallel-sessions.md` | core | Parallel agent sessions |
| `agent-rules/rules/015-destructive-actions.md` | core | Actions that need the developer's explicit confirmation |
| `agent-rules/rules/016-specifications-upkeep.md` | core | Keeping specifications current |
| `agent-rules/rules/017-communication.md` | core | Communication and reports |
| `agent-rules/rules/018-debugging-and-evidence.md` | core | Debugging and evidence |
| `agent-rules/rules/019-rule-layers-and-updates.md` | core | Rule layers, project overrides and boilerplate updates |
| `agent-rules/rules/104-tech-stack.md` | project | Technology stack and versions (nextjs) |
| `agent-rules/rules/105-architecture.md` | stack | Architecture and code style (nextjs) |
| `agent-rules/rules/106-node-backend.md` | stack | Node.js backend: controllers, services, imports (nextjs) |
| `agent-rules/rules/107-firebase-emulators.md` | stack | Firebase layout and local emulators (nextjs) |
| `agent-rules/rules/108-api-client.md` | stack | Backend API contracts and generated types (nextjs) |
| `agent-rules/rules/110-browser-security.md` | stack | Browser security and personal data (nextjs) |
| `agent-rules/rules/111-testing.md` | stack | Testing and checks (nextjs) |
| `agent-rules/rules/115-protected-files.md` | project | Protected setup, deployment and production files (nextjs) |
| `agent-rules/rules/201-repository-layout.md` | project | Repository layout and emulator setup of oilbot |
<!-- ai-ready-boilerplate:rules:end -->
