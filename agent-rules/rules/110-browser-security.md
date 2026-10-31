# 110 — Browser security and personal data (nextjs)

- **110.1** Everything that reaches the browser is public: `NEXT_PUBLIC_*` variables, client
  components, files in `public/`, source maps. Secrets are server-only variables without the prefix,
  read only in server code.
- **110.2** Committed `.env*` files hold only non-secret values; secrets come from the deployment
  environment or a secret manager; `.env*.local` is never committed.
- **110.3** Personal data (rule 010, `specifications/security/PERSONAL_DATA.md`) never goes into URLs
  (paths, query parameters, redirects), analytics or tag manager events (`dataLayer`, pixels),
  console output or error trackers, and into cookies or browser storage only as documented in
  `PERSONAL_DATA.md`.
- **110.4** Adding a third-party script, iframe, pixel, font or CDN, or changing what data one
  receives, needs the developer's confirmation and an entry in `PERSONAL_DATA.md` and
  `SYSTEM_OVERVIEW.md`. Tracking that needs consent (GDPR, ePrivacy) and has no consent mechanism is
  recorded as a question, not silently added.
- **110.5** Navigation or redirects to a URL taken from a query parameter, a cookie or an API
  response are checked against an allow-list of hosts (no open redirects).
- **110.6** `dangerouslySetInnerHTML` only with content the project fully controls or sanitizes.
- **110.7** Cookies: only what the feature needs; `Secure` and `SameSite` set; `HttpOnly` when only
  the server reads them; the lifetime documented in `PERSONAL_DATA.md`.
- **110.8** Messages from iframes (`postMessage`) are accepted only after checking `event.origin`.
- **110.9** Authentication and access checks in middleware and route handlers are not weakened or
  bypassed, not even for local testing in committed code (rule 115).
