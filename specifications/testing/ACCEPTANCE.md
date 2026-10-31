# Acceptance

A task is accepted when:

1. Every acceptance criterion in `../features/FEATURE_REGISTRY.yaml` is met and shown by a test or
   a recorded live check (HTTP status and body in the work log).
2. `agent-rules/scripts/gate.sh` passed: exit code 0, no skipped step.
3. A code review in a separate session took place and its findings are fixed.
4. The test document `../features-test/<TASK-ID>-TEST.md` lists what is not covered.
5. The specifications are updated (spec, registry, coverage, changelog, log, questions, bugs).

Statuses after the developer's check (`ready_for_test`, `done`) are set only by the developer. When acceptance
criteria change, update the spec, registry, log and changelog in the same task.
