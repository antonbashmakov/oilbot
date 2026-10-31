# 108 — Backend API contracts and generated types (nextjs)

- **108.1** The backend contracts this app consumes are owned by the backend repositories named in
  rule 001.8. Copy them only with the project's refresh command (rule 104.5, skill
  `refresh-api-types`); never edit the copied contract or the generated types by hand. Copied
  contracts are not linted here (`CONTRACTS` stays empty for them).
- **108.2** Use the generated types for every request and response; never hand-write a type that
  duplicates a contract schema.
- **108.3** A needed API change starts in the backend repository, contract first (its own rule 108);
  the frontend task depends on it (`depends_on` in the registry, or a question until it is
  available). Do not code against fields the contract does not have.
- **108.4** After a refresh: regenerate the types, run the type check, fix every usage, update the
  mocks (MSW handlers, fixtures, stories) to the new shapes, and record the contract change in the
  work log.
- **108.5** Every status code the contract declares for an operation the UI calls has a handled UI
  state (loading, error, empty, success); unknown errors show a generic message without internal
  details (rule 005.5).
- **108.6** Route handlers and server actions of this app (`app/api/`, BFF endpoints) are an API too:
  list them in `specifications/architecture/SYSTEM_OVERVIEW.md`; if the project has its own contract
  for them, change the contract first.
- **108.7** Mock data in fixtures and stories is synthetic: no real personal data (rule 010.2).
