# Code review session prompt — template

The writing session fills this template and gives it to the developer as a code block in the chat
(rule 012.3). Replace everything in angle brackets.

```text
Code review session for <project-name> (repository root: <path>, branch <branch>).

Read AGENTS.md and agent-rules/rules/012-code-review.md first. Sync the repository
(agent-rules/rules/013-git-and-sync.md) and stop if the sync is not clean.

Tasks in code_review:
- [<TASK-ID>] — <title> (<tracker> <id>)

Changed and new files (git status / git diff HEAD):
- <path> — <what changed>

Check against:
- specifications/features/<spec>.md — acceptance criteria of the tasks above
- specifications/features-test/<TASK-ID>-TEST.md and TEST_COVERAGE.yaml
- specifications/questions/OPEN_QUESTIONS.md, specifications/bugs/BUGS.md
- <ADRs, integration notes>

Look closely at:
- <risks, decisions taken along the way, places without tests, unverified external behaviour>

Order:
1. Run /code-review on the changes listed above.
2. Set the tasks to review_fixes in FEATURE_REGISTRY.yaml and fix the findings.
3. Run agent-rules/scripts/gate.sh. A skipped step is not a passed step.
4. Record the review (findings, fixes, gate per step) in the work log and CHANGELOG.
5. Set the tasks to ready_for_review and report.

Prohibited without the developer's word: commits, pushes, branch changes, tracker actions,
calls to production systems of external partners, changes outside the listed files except fixes of
findings.
```
