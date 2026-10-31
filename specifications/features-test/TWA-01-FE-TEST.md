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

## Browser check

Not done: the sign-in needs real init data, so the check is opening the deployed Mini App from
Telegram (`https://t.me/PoSebstoimostiBot/shop`).

## Not covered

No automated tests exist for `twa/` (features-test/README.md).
