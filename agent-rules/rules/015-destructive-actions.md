# 015 — Actions that need the developer's explicit confirmation

The project's own list of protected setup, deployment and production files is in the project-owned
rule `115-protected-files.md`.

- **015.1** Deleting directories or files; `git reset --hard`; force push; commit and push.
- **015.2** Deleting, renaming or editing applied database migrations; clearing a database;
  restoring a database from a dump.
- **015.3** Altering, creating or removing CI configuration (`.github/` and the CI files listed in
  `115-protected-files.md`).
- **015.4** Creating or changing project setup and deployment files listed in
  `115-protected-files.md`. Add dependencies only within a task (`004-dependencies-and-configuration.md`).
- **015.5** Changing production configuration (files, cloud resources, IAM, schedulers, queues)
  listed in `115-protected-files.md`.
- **015.6** Calling production systems of external partners; writing to the task tracker.
- **015.7** Deleting or rewriting `specifications/` content: source task texts, registry, work logs,
  bug history, ADRs. Rewriting the PRD without keeping history.
- **015.8** Changing anything outside this repository: the developer's machine and tool
  configuration (package manager settings with credentials, shell profiles, `~/.claude/`, IDE
  settings), other repositories on the machine, system files. If a task seems to need such a change
  (for example to make the build work), describe it and let the developer make or confirm it.
- **015.9** Editing a file managed by the boilerplate (listed in `agent-rules/boilerplate.manifest`)
  or running the installer with `--force`; propose the change for the boilerplate repository
  instead (`019-rule-layers-and-updates.md`).
