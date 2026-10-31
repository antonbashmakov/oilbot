# 014 — Parallel agent sessions

- **014.1** Several agent sessions may work in the same working tree. Before editing a shared
  file (registry, questions, changelog, bugs), re-read it; change only your own entries; never roll
  back changes made by another session.
- **014.2** Before creating a "new" file, check that it does not exist yet (`ls`): writing over
  a file created by another session loses its work.
- **014.3** IDs that parallel branches create (migration IDs and similar) follow the stack rules so
  that parallel sessions never collide. Do not take question or bug numbers another session has already
  used: re-read the file right before adding an entry.
- **014.4** Stop your own processes by PID only, never with `pkill -f <pattern>`.
- **014.5** Do not restart or migrate a database, dev server or stack started by another session;
  use your own (separate test database, separate port) or ask.
- **014.6** If the gate fails because of another session's changes, say so explicitly and do
  not change that code.
