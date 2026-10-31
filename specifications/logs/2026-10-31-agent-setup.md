# 2026-10-31 — Agent setup adoption (SETUP-01-DOC)

## Plan

- Sources: the ai-ready boilerplate in the local `aimakler` checkout (commit c4050fe), the code
  and git history of this repository. No tracker task.
- Install core plus the `nextjs` stack with `install.py` (the developer asked for the boilerplate
  without aimakler's tasks and history; only the clean templates from `core/` and `stacks/` were
  installed).
- Fill in the project-owned files from the code: `AGENTS.md` project sections, rules 001, 104, 115,
  `agent-rules/project.sh`, the registry project section, PRD, system overview, personal data,
  test kinds. Record differences from the stack rules as project rule 201.
- Check: placeholder grep, generators, `agent-rules/scripts/gate.sh`.

## Done

- Installed the boilerplate (86 managed files); added `!specifications/logs/` to `.gitignore`
  because its `logs` pattern hid this folder.
- Filled in the project-owned files; added rule `201-repository-layout.md` (overrides 107.1–107.3,
  107.5, 107.6, 107.8, 107.9, 107.11).
- Recorded questions Q-01–Q-06 and bugs BUG-001–BUG-003.

## Checks

Gate 2026-10-31, exit 1: agent and specs steps PASS; contracts FAIL (BUG-003); the 11 build steps
SKIP (Node 20.20.2 on the machine, functions need 22; `crm/node_modules` missing). Details in
`features-test/SETUP-01-DOC-TEST.md`.

## Code review

Not done yet.

## Statuses

`SETUP-01-DOC`: planned → in_progress (80 %). Remaining: the developer's answers to Q-01–Q-06,
a gate run with Node 22 and installed dependencies, the contract fix (BUG-003).

## Findings and decisions

- Assumed tracker: GitHub issues of `antonbashmakov/oilbot` (label `GH`), client: the developer.
- Package manager yarn (yarn-installed `node_modules`, root README); `package-lock.json` files
  left untouched (Q-02).
- Emulator project stays `test-project` because the tests hard-code it (rule 201.3).
- `firebase-tools` is not pinned; the gate uses the global CLI (rule 201.4).
