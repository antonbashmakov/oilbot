# TWA-01-FE — Test spec

- Task: `TWA-01-FE` — Telegram sign-in in the Mini App and the real customer in the chat
- Spec: [TWA-01-mini-app-launch.md](../features/TWA-01-mini-app-launch.md)
- Gate run: see the work log `logs/2026-10-31-twa-launch.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` Telegram script, `ready()`, `expand()`, sign-in through `/public/auth` | built `index.html` contains `telegram-web-app.js`; code review of `CustomerSessionProvider.tsx` | build, manual |
| `[Team]` customer id and token from the session, nothing hard-coded | `tsc --noEmit`; code review of `ChatView.tsx`, `useClient.ts`, `api/index.ts` | types, manual |
| `[Team]` notice outside Telegram or after failed sign-in | code review of `SessionGate.tsx` | manual |
| `[Team]` production build calls the API on its own origin | `yarn build` with `.env.production`; no `127.0.0.1:5001` in `.next/` | build |
| `[Team]` dev sign-in outside Telegram, not in production | browser check below; `yarn build`: the fake token is in no build file, the signing code only in a server source map, none in `.next/static` | browser, build |

## Browser check

2026-10-31, `next dev` on port 3107 against the emulators (project `test-project`, ports 5101/8180)
with one synthetic product seeded, built-in browser:

- Desktop width: dev sign-in → greeting shown; sent "Volkswagen Golf 2015 1.4 TSI" → the user
  message and the mock recommendation card "Test Oil 5W-30" shown. Network: `POST /api/public/auth`
  200, `GET` and `POST /api/private/customers/{id}/chats/latest/messages` 200 with the Bearer token.
- 375 px: `?tgUser=100000002` → a new customer with its own empty chat; layout fits.
- Console: a hydration warning from `telegram-web-app.js` setting styles on `<html>` was fixed with
  `suppressHydrationWarning`; after reload no issue is reported. In dev, React Strict Mode signs in
  twice (two `/public/auth` calls).
- Not checked: the Mini App inside Telegram (`https://t.me/PoSebstoimostiBot/shop`); needs a deploy.

## Not covered

No automated tests exist for `twa/` (features-test/README.md).
