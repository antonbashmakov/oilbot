# 004 — Dependencies and configuration

The fixed versions, package sources and configuration format of this project are in the stack's
project-owned rule `104-tech-stack.md`.

- **004.1** Use the versions fixed in `104-tech-stack.md`. Do not upgrade, downgrade or replace a
  library silently; a version change is a task with its own reason.
- **004.2** If a fixed version is unavailable, record a question in `OPEN_QUESTIONS.md` and stop.
- **004.3** New dependencies only with a permissive licence (MIT, BSD, Apache 2.0, ISC) and a
  written reason in the work log. GPL and AGPL are not allowed; anything else needs the developer's
  approval. Pin the version of every new dependency; never add one as `latest` or with an open range
  that the stack rules forbid.
- **004.4** Use the build tool and package manager named in `104-tech-stack.md` only; never create
  or update the lock file of another package manager.
- **004.5** When editing a configuration file, change only the keys the task needs; never remove or
  rewrite unrelated settings.
