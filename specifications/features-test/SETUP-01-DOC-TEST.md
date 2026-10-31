# SETUP-01-DOC — Test spec

- Task: `SETUP-01-DOC` — Adapt the agent workflow to this project
- Spec: [SETUP-01-agent-workflow.md](../features/SETUP-01-agent-workflow.md)
- Gate run: 2026-10-31, exit 1. PASS: agent / stack, managed files, rule index, .cursorrules;
  specs / registry, spec index, project review, freshness. FAIL: contracts / api.yml (3 errors),
  contracts / models.yml (5 errors) — BUG-003. SKIP: all 11 build steps (precheck: Node 20.20.2 on
  the machine, functions need Node 22; `crm/node_modules` missing).

## Criteria → checks

| Criterion | Check | Kind |
|---|---|---|
| `[Team]` stack installed | gate step "agent / stack" passes | gate |
| `[Team]` no placeholder left | `grep -rn '<placeholder\|ADOPT' AGENTS.md agent-rules/project.sh agent-rules/rules/001-* agent-rules/rules/104-* agent-rules/rules/115-* specifications` returns nothing relevant | manual |
| `[Team]` project.sh configured | gate build steps run instead of SKIP; "contracts" runs or the project has no contract of its own | gate |
| `[Team]` registry project section | review page shows the project name, client and tracker | manual |
| `[Team]` gate passes | `agent-rules/scripts/gate.sh` exit code 0 | gate |

## Not covered

Content quality of the PRD and the system overview: checked by the developer.
