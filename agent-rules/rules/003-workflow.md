# 003 — Task workflow and statuses

## Steps

- **003.1** Every task follows these steps:
  1. Sync the repository (`013-git-and-sync.md`).
  2. Find the task in `specifications/features/FEATURE_REGISTRY.yaml`: criteria, dependencies,
     tracker IDs.
  3. Read the spec through `SPEC_INDEX.md` or create it from `_TEMPLATE.md`.
  4. Write the plan into `specifications/logs/YYYY-MM-DD-<topic>.md` **before** coding.
  5. If the change touches an API contract, change the contract first as the stack rules say
     (`105-architecture.md`, and `108-*.md` when the stack has one).
  6. Implement code and tests (stack rules `1xx`, project rules `2xx`).
  7. Update the test document `features-test/<TASK-ID>-TEST.md` and `TEST_COVERAGE.yaml`.
  8. Update the registry (`status`, `progress_percent`), changelog, bugs, questions, log.
  9. Run the gate `agent-rules/scripts/gate.sh` (`011-quality-gate.md`).
  10. Set `code_review`, give the developer a summary and a ready prompt for a separate review session
      (`012-code-review.md`).
- **003.2** One task — everything at once: a change that affects behaviour or the contract
  updates, in the same task, the spec, the API contract, the registry, `TEST_COVERAGE.yaml` and the
  test document. A change that contradicts the spec is not accepted without updating the spec.
- **003.3** Requirements that are not in the task text are not added to the task: only through
  a question.
- **003.4** Hand the task to review only when nothing is left open in it (no open criteria,
  blockers or unagreed behaviour). Otherwise report what is done and what blocks.

## Status model

- **003.5** Statuses: `planned` (Not started) → `in_progress` (In progress) → `code_review`
  (Code review) → `review_fixes` (Review fixes) → `ready_for_review` (Ready for review) →
  `ready_for_test` (RFT) → `done` (Done). `blocked` (Blocked) is possible at any step and always
  has a reason.
- **003.6** An agent sets statuses up to `ready_for_review`, and only when all acceptance
  criteria are met. Moving straight from `in_progress` to `ready_for_review` is not allowed: a
  review comes in between. `ready_for_test` and `done` are set only by the developer.
- **003.7** `done` requires a passed gate and all acceptance criteria met.

## Registry discipline

- **003.8** The registry is edited by several sessions and by the developer: re-read the file right
  before editing, change only the fields of your own tasks, never roll back statuses set by others.
- **003.9** Task IDs: `<AREA>-NN-<SURFACE>` (`ORDER-01-BE`, `DEPLOY-01-OPS`, `AGENT-01-DOC`);
  foundation tasks `FOUNDATION-NNN`. Each task keeps its tracker IDs in `tracker_ids`.
- **003.10** Pick work in this order when choosing yourself: tasks that unblock other tasks,
  then defects of existing scenarios, then consistency of specifications with the registry.
