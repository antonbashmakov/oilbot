# specifications

Knowledge base and source of truth of the project. Agents and developers read it before any
task and update it in the same task as the code (`agent-rules/rules/016-specifications-upkeep.md`).
Statuses and progress live only in `features/FEATURE_REGISTRY.yaml`.

| Folder | What lives there | Updated when |
|---|---|---|
| `product/` | `PRD.md` — what the product does and why; `CHANGELOG.md`; `source-tasks/` — original tracker task texts, never edited | Product scope changes; every finished work (changelog); a new tracker task |
| `features/` | `FEATURE_REGISTRY.yaml` — epics and tasks with criteria and statuses; one spec per epic (`_TEMPLATE.md`); `SPEC_INDEX.md` — generated index | Every task |
| `features-test/` | `<TASK-ID>-TEST.md` — criteria mapped to tests and "Not covered"; `TEST_COVERAGE.yaml` | Tests added or changed |
| `questions/` | `OPEN_QUESTIONS.md` — open questions with behaviour until answered, and the decisions table | A question arises or is answered |
| `architecture/` | `SYSTEM_OVERVIEW.md` — components, flows, data model, deployment; `adr/` — decisions | Architecture, schema or deployment changes |
| `integrations/` | One file per external system: contract summary, assumptions, real API findings | A real request shows how the system behaves |
| `security/` | `PERSONAL_DATA.md` — personal data inventory and handling | Personal data stored or sent |
| `testing/` | `ACCEPTANCE.md` — how a task is accepted | Acceptance rules change |
| `i18n/` | `PROJECT_REVIEW.ru.yaml` — Russian texts of the data on the project review page | Registry, source tasks or questions change (when translations are required) |
| `logs/` | One work log per piece of work: plan, done, checks, review, statuses, findings | Every piece of work |
| `bugs/` | `BUGS.md` — defects with status and links | A defect is found or fixed |

## Conventions

- Task IDs: `<AREA>-NN-<SURFACE>` (`ORDER-01-BE`, `CHECKOUT-01-FE`), foundation tasks `FOUNDATION-NNN`; tracker IDs
  in the `tracker_ids` field.
- Every acceptance criterion starts with a source label: `[<TRK>-<id>]` (tracker prefix from
  `project.tracker.label`), `[API]`, `[ADR-NNN]`, `[Q-NN]`, `[BUG-NNN]`, `[Review YYYY-MM-DD]`,
  `[Team]`, and the project labels in `project.extra_labels`.
- Questions `Q-NN`, bugs `BUG-NNN`, ADRs `ADR-NNN`: numbers are never reused.
- Dates are absolute (`YYYY-MM-DD`).
- `agent-rules/scripts/gate.sh` validates the registry, labels, coverage, questions, bugs, links and
  the spec index.
