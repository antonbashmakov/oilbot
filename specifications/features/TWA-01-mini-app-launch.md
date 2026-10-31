# TWA-01 — Mini App launch in Telegram

## Tasks

| Task | Surface | Tracker |
|---|---|---|
| `TWA-01-BE` | backend | — |
| `TWA-01-FE` | frontend | — |

## Context

The customer Mini App (`twa/`) must work when opened from a Telegram channel post through the
direct link `https://t.me/PoSebstoimostiBot/shop`. Before this epic the app used one hard-coded
customer, never signed in, and the chat API had no authentication (BUG-001). PRD section 3 (AI
oil-selection chat).

## Scope

In scope: Telegram sign-in from the Mini App, a customer token checked by the private chat API,
the latest chat history, the Firestore index for the chat query, a mock AI in the test emulator,
production environment of `twa/`. Out of scope: buying from the chat (the Buy button has no order or
payment endpoint on `master`), VK sign-in in `twa/`, BotFather and channel setup, product data.

## Business rules

1. `[Team]` The Mini App signs in with `Telegram.WebApp.initData` through `POST /public/auth`;
   the backend checks its signature with the bot token and accepts it for one hour.
2. `[Team]` The backend answers with the customer and a customer token (JWT, claim `customerId`,
   valid 1 day), also set as the `__session` cookie (the only cookie Firebase Hosting forwards).
3. `[Team]` `/private/customers/{customerId}/…` requires a customer token (`Authorization: Bearer`
   or `__session`): 401 without a valid one, 403 when its `customerId` differs from the path.
4. `[Team]` The chat shows and sends to the AI the latest 10 messages, oldest first.
5. `[Team]` Outside Telegram (no init data) or after a failed sign-in the app shows a message and no
   chat.
6. `[Team]` Under `next dev` only, without Telegram init data the app signs its own init data with
   the test bot token from `twa/.env.development` (the same fake token as
   `functions/.env.test-project`) for user `NEXT_PUBLIC_DEV_TELEGRAM_USER_ID` or `?tgUser=<id>`
   (`twa/src/utils/devTelegram.ts`). Production has the real bot token, so such data is refused there.

## Pages and routes

`/` of `twa/`: unchanged route; now waits for sign-in before showing the chat.

## UI states

Signing in (loading), not in Telegram, sign-in failed, chat.

## API calls

| Operation | Status codes handled |
|---|---|
| `POST /public/auth` (`authenticateCustomer`) | 200, 400, 403, 500 → sign-in failed state |
| `GET /private/customers/{customerId}/chats/{chatId}/messages` | 200; 401/403 → sign-in failed state |
| `POST /private/customers/{customerId}/chats/{chatId}/messages` | 200; errors leave the pending message |

## Personal data

The customer token is kept in memory only. Init data is no longer logged (BUG-002). See
[PERSONAL_DATA.md](../security/PERSONAL_DATA.md).

## Tests

[TWA-01-BE-TEST.md](../features-test/TWA-01-BE-TEST.md),
[TWA-01-FE-TEST.md](../features-test/TWA-01-FE-TEST.md).

## Known issues

BUG-001, BUG-002 (fixed by TWA-01-BE) — [BUGS.md](../bugs/BUGS.md).

## Open questions

Q-03 (contract), Q-06 (DeepSeek) — [OPEN_QUESTIONS.md](../questions/OPEN_QUESTIONS.md).
