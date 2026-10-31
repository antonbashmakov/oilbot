# 011 — Quality gate and evidence

## Gate

- **011.1** The gate is one command from the repository root: `agent-rules/scripts/gate.sh`.
  Steps: agent setup (stack installed, managed files unchanged, rule index and `.cursorrules` up
  to date), specification checks (registry, labels, coverage, questions, bugs, links), spec index
  freshness, project review page freshness, "code changed without specifications", lint of the
  OpenAPI contracts in `CONTRACTS`, the build and test steps (`BUILD_STEPS` or `BUILD_CMD` in
  `agent-rules/project.sh`).
  It does not stop at the first failure and prints a summary with the tail of every failed step.
- **011.2** Exit codes: `0` — every step passed; `1` — at least one step failed; `2` — no
  failures but at least one step was skipped or not run. A step marked `N/A` does not apply to the
  project by a setting in `agent-rules/project.sh` (for example `CONTRACTS="none"`); it is not a
  skip, and only the developer decides that a step does not apply.
- **011.3** **A skipped step is not a passed step.** "N passed, M skipped" is an incomplete
  gate. Report it as "Gate: not complete — <step> not run" with the exact reason and command
  output. Forbidden wording: "gate green, functional skipped", "all passed except skipped".
- **011.4** Before saying "done", run the gate and check the business logic, not only
  compilation. A failed step means the task is not done.
- **011.5** If a step needs an environment (SDK, build tool, Docker, private package registries,
  dependencies), bring it up with the documented command (`111-testing.md`) and run the step. Before
  starting or restarting a shared database or stack, check that no other session uses it; never
  touch a database instance you did not start.
- **011.6** If the environment cannot be brought up (missing access, secret or tool), stop and
  report which step did not run, why (with the command output) and what is needed.
- **011.7** A green gate means "ready for code review", not "ready for the developer".

## Tests

- **011.8** The test kinds, frameworks and tools of this stack are in `111-testing.md`; the project's
  own list of test kinds is in `specifications/features-test/README.md`.
- **011.9** Clients of external systems are tested against a stub or mock, never against a
  partner's production; contract assumptions in the stub are labelled "not verified" until a real
  response confirms them (`009-integrations.md`).
- **011.10** Every task has a test document `specifications/features-test/<TASK-ID>-TEST.md`
  that maps acceptance criteria to tests or recorded checks and lists what is not covered;
  `TEST_COVERAGE.yaml` keeps the per-task status (`planned`, `in_progress`, `done`, `n/a`). Coverage
  is tracked separately from progress.

## Checks beyond tests

- **011.11** Verify by running when you can: start the application locally and exercise the real
  flow (call the endpoint, open the page), and put the actual result (HTTP status and body, what the
  page showed, console errors) into the report. A unit test supplements this check, it
  does not replace it.
- **011.12** Before blaming your change for a failure, compare with the baseline: run the same
  check without your change; re-run a suspected flaky test separately and several times.
- **011.13** "Builds" and "runs" are different results; report them separately.
- **011.14** Remove test data you created (database rows, partner test cases, browser state) after a check.
