# 111 — Testing and checks (nextjs)

- **111.1** The gate's build steps (`BUILD_STEPS` in `agent-rules/project.sh`) run in this order:
  API type generation (if the project has it), type check, lint, tests, production build. A project
  without automated tests says so in `specifications/features-test/README.md`; adding a test
  framework is a task with its own reason (rule 004.3).
- **111.2** Test kinds for `TEST_COVERAGE.yaml`:
  - `types` — `tsc --noEmit` passes;
  - `lint` — the project's lint passes;
  - `unit` — Vitest or Jest with Testing Library, when the project has it; for the backend, Jest
    tests of a service or processor with mock services for external systems;
  - `integration` — backend tests against the Firebase emulators (111.7);
  - `story` — the component renders in Storybook with mocks for each state (loading, error, empty,
    success, partner or theme variants), when the project has Storybook;
  - `e2e` — Playwright or similar, when the project has it;
  - `build` — `next build` passes;
  - `browser` — checked in a real browser, evidence in the work log (111.3).
- **111.3** Browser check (rule 011.11, skill `verify-in-browser`): run the dev server, open every
  changed page at desktop and mobile width, go through the changed flow, check the browser console
  (no new errors or warnings) and the network calls (right endpoints and payloads; no personal data
  to third parties), and record what was seen in the work log.
- **111.4** Local runs use a local or development backend, or mocks; never a production backend with
  real personal data.
- **111.5** Run `next build` (not only `next dev`) when changing `next.config.*`, the middleware,
  environment variable usage, dependencies or server components: the dev server hides some build
  errors.
- **111.6** Start your own dev server on a free port and stop it by PID afterwards (rule 014.4).
- **111.7** Backend (rules 106, 107): services and processors are tested against the Firestore
  emulator, never with a mocked Firestore; HTTP modules with `supertest` against the functions
  emulator (`http://127.0.0.1:<port>/demo-<slug>/<region>/<module>`). The suite runs inside
  `npx firebase emulators:exec --project demo-<slug> …`, with `GCLOUD_PROJECT=demo-<slug>` set in
  the Jest setup, and `test/setup.ts` deletes every collection of `COLLECTIONS` after each test.
  External systems are the mock services (106.8); a test against a real third-party sandbox is
  named `*.real.test.ts` and is excluded from the gate.
- **111.8** With the Firebase layout the gate runs both packages: functions type check, lint,
  build and integration tests (the build comes before the tests because the functions emulator
  loads `functions/lib/`), then the UI type check, lint, tests and build (`BUILD_STEPS` in
  `agent-rules/project.sh`). Lint in the gate never uses `--fix`.
- **111.9** A new or changed endpoint has an integration test of its success path, its validation
  errors and its authorization (missing, wrong role) before it is handed to review.
