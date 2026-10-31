# 018 — Debugging and evidence

- **018.1** For any bug, failing test, unexpected behaviour or suspicious log, read the project
  code before drawing a conclusion. Logs, stack traces, screenshots and failing tests are entry
  points only.
- **018.2** Investigation order: sync → read the error → find the related source files →
  inspect the implementation → trace data and control flow → check tests, configuration, schema,
  migrations, generated code → only then explain the cause and propose or implement a fix.
- **018.3** Every important conclusion is tied to evidence: file and line, function, condition,
  configuration key, changeSet, test or commit. If evidence is incomplete, say exactly what is
  missing.
- **018.4** Deployment configuration often lives outside the repository (CI variables,
  runtime environment of the hosting, secret managers). Do not conclude production behaviour from
  repository defaults; check the live environment or mark the conclusion as unverified.
- **018.5** Before stating that a tool, SDK or service is missing, ask the tool itself
  (for example `java -version`, `node -v`, `mvn -v`, `docker info`, `gcloud auth list`) and
  list the places and commands checked; write "not found in these places", not "absent".
