# agent-rules

Rules and tooling for AI coding agents working in this repository, installed from
`ai-ready-boilerplate`. `AGENTS.md` at the repository root is the entry point; this folder holds the
details, `specifications/` the project knowledge.

## Layers

| Rules | Layer | Owned by |
|---|---|---|
| `0xx` | core: every project | ai-ready-boilerplate (managed) |
| `1xx` | stack named in `boilerplate.lock` | ai-ready-boilerplate (managed), except `104` and `115` |
| `001`, `104`, `115`, `2xx` | project | this repository |

Managed files are listed with checksums in `boilerplate.manifest`; the gate fails when one is edited
here. Change them in the boilerplate repository and update with its installer (rule 019).

## Contents

| Path | Purpose |
|---|---|
| `boilerplate.lock` | Boilerplate source, version and the installed stack. Written by the installer. |
| `boilerplate.manifest` | Checksums of the managed files. Written by the installer. |
| `project.sh` | Project settings for the gate and the Stop hook: code paths, exempt paths, contracts, build steps. |
| `rules/` | Rules by layer and area. `AGENTS.md` lists them (generated index). |
| `scripts/gate.sh` | Quality gate: agent setup, specification checks, contract lint, build and test steps. |
| `scripts/check_setup.py` | Stack installed (`--stack`), managed files unchanged (`--managed`), SessionStart reminder (`--hint`). |
| `scripts/gen_rule_index.py` | Regenerates the rule index in `AGENTS.md`; `--check` fails if it is stale. |
| `scripts/check_specs.py` | Validates the task registry, criteria labels, test coverage, questions, bugs and Markdown links. |
| `scripts/gen_spec_index.py` | Regenerates `specifications/features/SPEC_INDEX.md`; `--check` fails if it is stale. |
| `scripts/spec_freshness.sh` | Detects code changes without any change in `specifications/`; used by the gate and by the Claude Code Stop hook. |
| `scripts/gen_project_review.py` | Generates `specifications/PROJECT_REVIEW.html`; `--check` fails if it is stale. Claude Code skill: `.claude/skills/project-review/`. |
| `scripts/gen_cursorrules.py` | Generates `.cursorrules` from `AGENTS.md` and `rules/`; `--check` fails if it is stale. |
| `scripts/specs_lib.py`, `scripts/boilerplate_lib.py` | Shared helpers. |
| `prompts/code-review.md` | Template of the prompt for a separate code review session. |
| `redocly.yaml` | Lint configuration for the OpenAPI contracts. |

## How agents pick the rules up

- **Claude Code** reads `CLAUDE.md`, which imports `AGENTS.md`. Hooks in `.claude/settings.json`:
  SessionStart reminds the agent when no stack is installed; Stop asks the agent once to update
  `specifications/` when code changed without them. Skills live in `.claude/skills/`.
- **Codex** reads `AGENTS.md` natively.
- **Cursor** and any pipeline that needs one rules file read `.cursorrules`, generated from
  `AGENTS.md` and `rules/`.

## Requirements for the scripts

`bash`, `git`, `python3` (standard library only), `node` with `npx` (downloads `js-yaml@4.1.0` and
`@redocly/cli@2.62.1` on first use). The build steps need whatever `BUILD_STEPS` in `project.sh`
needs.
