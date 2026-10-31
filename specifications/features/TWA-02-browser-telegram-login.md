# TWA-02 — Telegram login in a web browser

## Tasks

| Task | Surface | Tracker |
|---|---|---|
| `TWA-02-BE` | backend | — |
| `TWA-02-FE` | frontend | — |

## Context

The developer's request (chat, 2026-10-31): when the chat runs in a web browser, the customer logs
in with Telegram, so a real Telegram login can be used when testing; the customer is the one with
that Telegram id (the same as in the Mini App).

## Scope

In scope: Telegram Login Widget (the "legacy" widget, core.telegram.org/widgets/login-legacy),
its server check, the login screen, keeping the login over reloads, a dev proxy for a tunnel. Out
of scope: Telegram's newer OpenID Connect login, VK login in a browser, logout.

## Business rules

1. `[Team]` In the Telegram Mini App sign-in is unchanged (TWA-01). Under `next dev` with
   `?tgUser=<id>` the dev sign-in runs (TWA-01, now only with the parameter). Otherwise the app shows
   the Telegram login button of the bot `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.
2. `[Team]` The widget's data (`id`, `first_name`, `last_name`, `username`, `photo_url`,
   `auth_date`, `hash`) goes to `POST /public/auth/telegram-login`. The backend builds the
   data-check-string of all fields except `hash` (sorted `key=value`, joined by `\n`), checks
   `hash` = hex HMAC-SHA-256 with key SHA-256(bot token), and accepts `auth_date` up to 24 hours old.
3. `[Team]` The answer is the same as `POST /public/auth`: the customer with origin `TELEGRAM` and
   that Telegram id (found or created, BUG-005 rules), and a customer token.
4. `[Team]` The widget's data is kept in `sessionStorage` of the tab and sent again after a reload;
   when it is refused (older than 24 hours), the login button is shown again.
5. `[Team]` The widget works only on the domain linked to the bot (`/setdomain` in @BotFather), so a
   local test runs through an HTTPS tunnel to `next dev`; with `DEV_API_PROXY` set, `next dev`
   forwards `/api/*` to the emulator, and `NEXT_PUBLIC_BASE_API_URL` is left empty.

## UI states

Signing in; login required (Telegram button, or a hint when the bot name is not configured);
sign-in failed (message and the button again); chat.

## API calls

| Operation | Status codes handled |
|---|---|
| `authenticateTelegramLogin` `POST /public/auth/telegram-login` | 200; 400/403/500 → failed state with the button |

## Personal data

The widget's data (Telegram id, names, username, photo URL) is in the tab's `sessionStorage` until
the tab closes; names are stored on the customer as for the Mini App; `photo_url` is not stored.

## Tests

[TWA-02-BE-TEST.md](../features-test/TWA-02-BE-TEST.md),
[TWA-02-FE-TEST.md](../features-test/TWA-02-FE-TEST.md).

## Open questions

None.
