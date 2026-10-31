# 002 — Source of truth

- **002.1** `specifications/` is the source of truth. Before any implementation read the task
  in `features/FEATURE_REGISTRY.yaml`, its spec (through `features/SPEC_INDEX.md`, not by guessing
  the file name), `product/PRD.md`, the original task text in `product/source-tasks/`,
  `architecture/` (overview and ADRs), `integrations/`, `questions/OPEN_QUESTIONS.md`,
  `bugs/BUGS.md` and recent `logs/`.
- **002.2** Do not reconstruct product intent from code alone. If code and specifications
  disagree, stop and report the mismatch before implementing.
- **002.3** Requirements come only from: the original task text (task tracker), the API contract,
  ADRs and decisions of the developer recorded in `questions/OPEN_QUESTIONS.md`. Existing code is not a
  requirement.
- **002.4** If a requirement is missing or ambiguous, do not invent behaviour: add a question
  `Q-NN` with the behaviour to use until it is answered, and write in the spec
  "undefined — see Q-NN". A safe default is allowed only if it is written down.
- **002.5** If a feature has no spec yet, create it from `features/_TEMPLATE.md` with
  acceptance criteria first, regenerate the index (`python3 agent-rules/scripts/gen_spec_index.py`),
  then write code.
- **002.6** Every acceptance criterion starts with a source label:
  `[<TRK>-<id>]` original tracker task (prefix from `project.tracker.label` in the registry),
  `[API]` our API contract, `[ADR-NNN]`, `[Q-NN]` answered question, `[BUG-NNN]`,
  `[Review YYYY-MM-DD]` code review finding, `[Team]` team clarification, plus project labels from
  `project.extra_labels` (for example a partner contract). The gate fails on a criterion without a
  label.
- **002.7** Status and progress live only in `FEATURE_REGISTRY.yaml`; specs do not repeat them.
- **002.8** Tracker task texts are inputs: copy the original text verbatim into
  `product/source-tasks/<tracker id>.md` and never edit it; derive criteria in the registry.
- **002.9** Future dates, contradicting statuses, disagreements between registry, logs and
  specs: do not fix silently. Compare sources, choose the safe correction and record it in the log,
  or ask.
- **002.10** Fixed versions are part of the source of truth (`104-tech-stack.md`). If a fixed
  version is unavailable, do not replace it silently: add a question and stop.
