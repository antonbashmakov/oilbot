# 009 — External systems: conclusions only from real responses

- **009.1** Any statement about how an external system behaves (which fields it returns, which
  parameters it requires, what it does with a wrong or missing value, status codes, response shape)
  must be backed by a real request and its real response captured in the same session.
- **009.2** Contracts, vendor documentation, Postman collections, task texts and earlier notes are
  entry points only. A field missing from a document is not evidence that it is missing from the
  response.
- **009.3** Without access, do not state behaviour as a fact: write "not verified — the document
  claims X — verification needs access". Never build a workaround (hardcoded value, default,
  fallback, mapping) on an unverified assumption.
- **009.4** When a real response contradicts the document, the real response wins: report the
  mismatch and record it in `specifications/integrations/<SYSTEM>.md` under "Real API findings"
  with the date, the request and the (redacted) response.
- **009.5** When the owners of an external system report that they changed or fixed something on
  their side, repeat the real request before relying on the change.
- **009.6** Use test or sandbox environments of external systems for any manual or automated call.
  Calling production requires the developer's explicit confirmation. Credentials come from
  environment variables or a secret manager only.
- **009.7** Integration code written from documentation before a real response is available is
  marked in code review notes and in the spec as "not verified against the test environment".
- **009.8** The task tracker is read-only for agents: never create, update or comment on tracker
  tasks without the developer's explicit command.
- **009.9** A local run may reach shared external systems (storage, e-mail, partner APIs): send only
  harmless test data, avoid paths that send e-mail or create real records, tell the developer which
  external calls were made, and remove test data afterwards.
