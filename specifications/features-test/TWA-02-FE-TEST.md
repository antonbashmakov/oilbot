# TWA-02-FE — Test spec

- Task: `TWA-02-FE` — Telegram login button when the chat runs in a web browser
- Spec: [TWA-02-browser-telegram-login.md](../features/TWA-02-browser-telegram-login.md)
- Gate run: see the work log `logs/2026-10-31-browser-telegram-login.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` login button outside Telegram; chat after login | browser check below (callback with test-signed data) | browser |
| `[Team]` login survives a reload | browser check below | browser |
| `[Team]` dev sign-in only with `?tgUser` | browser check below | browser |
| `[Team]` `DEV_API_PROXY` serves `/api` from `next dev` | browser check below; `curl` to `/api/public/auth/telegram-login` on the dev server → 400 from the emulator | browser |

## Browser check

2026-10-31, `next dev` on 3107 with `NEXT_PUBLIC_BASE_API_URL` empty,
`DEV_API_PROXY=http://127.0.0.1:5101/test-project/us-central1`,
`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=PoSebstoimostiBot`, emulators on 5101/8180 (mock AI):

- `/` → "Войдите через Telegram, чтобы продолжить." with the widget iframe
  (`oauth.telegram.org/embed/PoSebstoimostiBot`), which shows "Bot domain invalid" on localhost.
- `window.onTelegramAuth(...)` with data signed by the test bot token (what the widget calls after a
  login) → `POST /api/public/auth/telegram-login` 200 on the app's origin, chat opened for
  `TELEGRAM_500000001`.
- Reload → signed in again from `sessionStorage`; `?tgUser=500000002` → dev sign-in.
- `yarn build`: the bot username is in the client files; the dev token and sign-in code are not.

## Not covered

A real Telegram login: it needs the bot's domain (`/setdomain`) on an HTTPS tunnel and the bot's
real token in `functions/.env.local`; to be done by the developer.
