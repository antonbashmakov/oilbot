---
name: project-review
description: Build or check the project review page specifications/PROJECT_REVIEW.html — every task with its status and readiness, search and filters, open questions and decisions, readiness by the technical assignment or by specifications. Use when asked for the project review, the state or progress of the project, "what is going on in the project", or after changing the task registry, the source tasks or the questions journal.
---

# Project review page

A static page that shows the team and stakeholders the current state of the project without an
agent session. It is generated from the specifications and committed with them; never edit it by
hand. Project name, client, task tracker and translation mode come from the `project` section of
`specifications/features/FEATURE_REGISTRY.yaml`.

## What the page contains

- Readiness by the technical assignment: the mean `progress_percent` of the registry tasks linked to
  the tracker tasks of `specifications/product/source-tasks/README.md`, and the same per tracker task.
  Without linked tasks the page says that there is no technical assignment.
- Readiness by specifications: the mean `progress_percent` of all registry tasks.
- Every task: status (label of the status model) with its percentage, epic, tracker links,
  dependencies, blocked reason, acceptance criteria with source labels, spec link. Search and filters
  by status and epic.
- Open questions with the behaviour until answered; decided and withdrawn questions with the answers.
- English by default with a switch to Russian. The interface is always translated; data texts are
  translated from `specifications/i18n/PROJECT_REVIEW.ru.yaml` and fall back to English unless
  `project.review_translation` is `required`.

Sources: `specifications/features/FEATURE_REGISTRY.yaml`, `specifications/product/source-tasks/README.md`,
`specifications/questions/OPEN_QUESTIONS.md`, Russian texts from `specifications/i18n/PROJECT_REVIEW.ru.yaml`.
Change the data there, not in the page.

## Steps

1. Make sure the sources are current: statuses and `progress_percent` in the registry reflect the
   work, questions and decisions are recorded (rules 003 and 016).
2. Only with `project.review_translation: required`: translate new or changed data texts into Russian. Run
   `python3 agent-rules/scripts/gen_project_review.py --missing`, add every printed line to
   `specifications/i18n/PROJECT_REVIEW.ru.yaml` with a Russian text (correct Russian, no abbreviated
   words), and delete entries the check reports as unused.
3. Build the page from the repository root:

       python3 agent-rules/scripts/gen_project_review.py

4. Check it: `python3 agent-rules/scripts/gen_project_review.py --check` must print
   "Project review: up to date". A failure that names a source-task row, an open question or a decision
   row means the entry does not follow the format of its file: fix the entry, not the generator.
   Exit 3 means `npx` is missing (the registry is read through
   `npx js-yaml`): report the step as not run, do not call it passed.
5. Show the page: open `specifications/PROJECT_REVIEW.html` locally in a browser. Do not publish it
   anywhere.
6. Report the readiness by the technical assignment and by specifications and the number of open
   questions from the page, with the task IDs written as "[ID] — title".

The gate (`agent-rules/scripts/gate.sh`, step "specs / project review") fails when the page is stale,
so regenerate it in the same task whenever the registry, the source tasks or the questions change.
