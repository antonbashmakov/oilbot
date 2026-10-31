---
name: add-endpoint
description: Add or change a backend endpoint or trigger in this project's Node.js backend (Firebase Cloud Functions in functions/) — contract first, the right controller module and its imports file, data access in a service, mocks for external systems, integration tests on the emulators, then the UI types and specs. Use when a task adds or changes an HTTP route, a webhook, a Firestore or scheduled trigger, a collection or a service.
---

# Add or change an endpoint

Rules: `106-node-backend.md`, `107-firebase-emulators.md`, `108-api-client.md`, `111-testing.md`
(111.7–111.9), `110-browser-security.md` (110.9).

## Steps

1. **Contract first** (106.13). Add or change the operation in
   `functions/resources/openapi/api.yml`: path under `/<module>/…`, `operationId`, request and
   response schemas, every status code the handler can answer. Regenerate the types
   (`<PKG> --prefix functions run openapi`) and re-export new schemas from `models/index.ts`.
2. **Pick the module** by audience (106.4): `public`, `private`, `admin`, `webhook`, or `db` for
   triggers. A new module only for a new audience or trigger kind: then create its three files
   (106.3), export its function from `index.ts`, add it to the emulator `api` routing (106.11), add
   the hosting rewrite `/api/<module>/**` (107.11, needs confirmation, rule 115) and a row in
   `SYSTEM_OVERVIEW.md`.
3. **Data access in a service** (106.7). Reuse the collection's service or add
   `<Entity>Service extends AbstractService<Entity>` with its name in `COLLECTIONS`. Every query,
   transaction and write is a service method; a rule that spans several services is a service
   method too. A service with dependencies gets `<Name>Service.import.ts` (106.9).
4. **External systems** (106.8). A new third party gets `<Name>Service` and `Mock<Name>Service` with
   the same methods; the module's `imports.ts` selects one with `isEmulated()`. Secrets come from
   Secret Manager or uncommitted env files, never from code (107.9).
5. **The handler** (106.5): import everything from `./imports`; validate the body, params and query;
   check the caller and roles (`authorize([...])`); call the services; answer with `api.*`; end
   with `catch (err) { return api.failure(res, err); }`. Webhooks verify the signature before any
   read or write. A side effect after a state change goes through an outbox event (106.12).
6. **Tests on the emulators** (111.7, 111.9): an integration test in
   `functions/src/test/integration/` for the success path, each validation error, missing token and
   wrong role; seed the data through the services, call the function with `supertest` at
   `http://127.0.0.1:5001/demo-<slug>/<region>/<module>`. Add new collections to `COLLECTIONS` so
   `test/setup.ts` clears them. Run `<PKG> test` at the root.
7. **The UI.** Copy the contract to the UI and regenerate its types (skill `refresh-api-types`);
   the hooks and components use the generated types (108.2) and handle every declared status
   (108.5).
8. **Run it locally** when the UI uses the endpoint (skill `run-emulators`, then
   `verify-in-browser`).
9. **Gate and specifications:** spec (API section), test document, `TEST_COVERAGE.yaml`
   (`integration`, plus UI kinds), `SYSTEM_OVERVIEW.md` (functions, collections, external systems),
   `PERSONAL_DATA.md` when the endpoint stores or returns personal data, log.
