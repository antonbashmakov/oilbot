# 012 — Code review

- **012.1** Every piece of work goes through at least one code review before the developer checks
  it: a review session (`/code-review` in Claude Code) or the developer's own review comments.
- **012.2** The review runs in a **separate session** with a fresh context, never in the
  session that wrote the code. The writing session does not start `/code-review` itself.
- **012.3** When the work is finished, the writing session sets the tasks to `code_review`,
  gives the developer a summary and a ready-to-paste prompt for the review session, built from
  `agent-rules/prompts/code-review.md`, as a code block in the chat (not as a file).
- **012.4** The prompt lists: task IDs in `code_review`; changed and new files (from
  `git status` and `git diff HEAD`); specs and test documents to check against the acceptance
  criteria; what to look at closely (risks, decisions taken along the way, places without tests);
  the status order `review_fixes` → fixes → gate → `ready_for_review`; the prohibitions (no commits,
  pushes or tracker actions without the developer's word).
- **012.5** The review session runs `/code-review` on the changes, sets `review_fixes`, fixes
  the findings, re-runs the gate, records the review in the work log and changelog, and sets
  `ready_for_review` (or `code_review` again if the developer asks for another round).
- **012.6** The developer's review comments in a message count as a review: fix them, re-run the
  gate, then hand the work over.
- **012.7** Review only the files of the tasks under review; changes of another session in the
  working tree are reported, not modified.
