# Bugs

Format: `- **[BUG-NNN]** description — status (open, fixed), area, task, source.`
Numbers are never reused.

## Open

- **[BUG-003]** The backend contract fails Redocly lint: `type: enum` instead of `type: string` for
  `Customer.origin` (`functions/resources/openapi/api.yml:164`) and `BroadcastTask.format`
  (`models.yml:324`), and `models.yml` has no `paths` — open, contract, —, found by the gate
  (SETUP-01-DOC, 2026-10-31).

## Fixed

- **[BUG-005]** Parallel `POST /public/auth` calls for a new Telegram user created two customers
  (React Strict Mode signs in twice in dev; also possible with overlapping requests in production);
  later sign-ins picked either one, so a saved car or chat could disappear — fixed, backend and
  `twa/`, CAR-01-BE: race-safe `findOrCreateByExternalId`, one sign-in per page load. Found in the
  CAR-01 browser check.

- **[BUG-001]** The private API had no authentication: anyone could read and add chat messages of
  any `customerId` and make the project pay for DeepSeek calls — fixed (not deployed), backend,
  TWA-01-BE: customer token required, 401/403. Found while adopting the agent setup.
- **[BUG-002]** `POST /public/auth` logged the Telegram/VK init data and the user profile — fixed
  (not deployed), backend, TWA-01-BE. Found while adopting the agent setup.
- **[BUG-004]** `ProductService` stored `created_at` as a string, so reading a product written through
  the service failed (`toDate is not a function`) — fixed, backend, TWA-01-BE. Found by the
  integration test.
