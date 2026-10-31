# features-test

- `<TASK-ID>-TEST.md` — one test document per task: which tests, stories or recorded checks cover
  which acceptance criteria, and a mandatory "Not covered" section. Template: `_TEMPLATE-TEST.md`.
- `TEST_COVERAGE.yaml` — per task and surface the status of each test kind: `planned`,
  `in_progress`, `done`, `n/a`. Coverage is tracked separately from progress.

Test kinds for this project: `types`, `lint`, `unit` and `integration` (Jest in `functions/`, on
the Firestore emulator), `story` (Storybook in `crm/` only), `build`, `browser` (recorded manual
checks). No automated tests exist for `crm/`, `twa/` or `bot/`, and there are no `e2e` tests.
