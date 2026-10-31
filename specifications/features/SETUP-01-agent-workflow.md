# SETUP-01 — Agent workflow adoption

## Tasks

| Task | Surface | Tracker |
|---|---|---|
| `SETUP-01-DOC` | docs | — |

## Context

This repository was set up with `ai-ready-boilerplate` (`install.py`): core rules, the rules of one
stack, `specifications/` and `.claude/`. The managed files come from the boilerplate and are not
edited here (rule 019); this task fills in the project-owned files for the project.

## Scope

In scope: choosing and installing the stack (skill `setup-stack`), placeholders in the project
sections of `AGENTS.md`, rules 001, 104 and 115, `agent-rules/project.sh`, the `project` section of
the registry, the first versions of the PRD, system overview and personal data inventory, project
rules `2NN` where the project needs them, the first real epics and tasks. Out of scope: product
features; changes to managed files (they go to the boilerplate repository).

## Business rules

1. `[Team]` The stack is chosen by the developer, never guessed by the agent (rule 019.6).
2. `[Team]` Every `<placeholder>` and `ADOPT` comment in project-owned files is resolved or deleted.
3. `[Team]` Managed files stay as installed; a needed change is proposed for the boilerplate
   repository, a project-specific one becomes a `2NN` rule.
4. `[Team]` After changing rules: `python3 agent-rules/scripts/gen_rule_index.py` and
   `python3 agent-rules/scripts/gen_cursorrules.py`.

## Tests

Checks in the gate: `check_setup.py --stack` and `--managed`, `gen_rule_index.py --check`,
`gen_cursorrules.py --check`, `check_specs.py`, `gen_spec_index.py --check`,
`gen_project_review.py --check`, contract lint, build and test steps. Test document:
[SETUP-01-DOC-TEST.md](../features-test/SETUP-01-DOC-TEST.md).

## Open questions

Q-01, Q-02, Q-03, Q-05 — [OPEN_QUESTIONS.md](../questions/OPEN_QUESTIONS.md).
