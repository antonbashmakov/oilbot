# 2026-10-31 — Telegram login in a web browser (TWA-02-BE, TWA-02-FE)

## Plan

- Source: the developer's request in chat; spec `features/TWA-02-browser-telegram-login.md`.
- Telegram docs read: core.telegram.org/widgets/login (now OpenID Connect) and
  /widgets/login-legacy (hash check with SHA-256 of the bot token, `/setdomain`).
- Contract: `POST /public/auth/telegram-login` (`TelegramLoginData`, answer `CustomerSession`).
- Backend: `verifyTelegramLogin` in `services/utils.ts`; the shared session answer in `public.ts`.
- UI: `TelegramLoginButton`, status `login-required`, sessionStorage restore, dev sign-in only with
  `?tgUser`; `next.config.ts` dev-only rewrite with `DEV_API_PROXY`.
- Checks: integration tests (signed with the test bot token), types, lint, build, browser check of
  the button and of the callback with test-signed data. A real Telegram login needs the developer.

## Done

- Contract: `authenticateTelegramLogin` `POST /public/auth/telegram-login`, `TelegramLoginData`;
  copied to `twa/`.
- Backend: `verifyTelegramLogin` (constant-time hash compare, 24-hour `auth_date`);
  `sendCustomerSession` shared by `/auth` and `/auth/telegram-login`.
- UI: `TelegramLoginButton` (widget script, `onTelegramAuth`), statuses `login-required` and
  `login-failed`, login data in `sessionStorage` per tab, dev sign-in only with `?tgUser`;
  `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` in `.env.production`; `next.config.ts`: `DEV_API_PROXY`
  rewrite and `DEV_TUNNEL_HOST` in `allowedDevOrigins`, both `next dev` only.
- Tests: `src/test/emulatorEnv.ts` so tests use the secrets the emulator loads.

## Checks

- `functions`: `tsc` OK, no lint errors on changed lines; tests on emulators 5101/8180: 52/52
  (4 new Login Widget cases).
- `twa`: `tsc` OK, new files lint clean, `yarn build` OK.
- Browser check recorded in `features-test/TWA-02-FE-TEST.md`. A real Telegram login is not done
  (needs the developer's tunnel and bot).

## Code review

Not done yet: needs a separate session (rule 012).

## Statuses

`TWA-02-BE`, `TWA-02-FE`: planned → in_progress → code_review (80 %; the real login is left).

## Findings and decisions

- The widget refuses localhost ("Bot domain invalid"); local tests need an HTTPS tunnel.
- The legacy widget, not OpenID Connect: it is still documented, needs no client registration
  beyond `/setdomain`, and its check is a few lines.
