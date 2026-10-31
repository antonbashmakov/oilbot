# TWA-02-BE — Test spec

- Task: `TWA-02-BE` — Sign-in with Telegram Login Widget data
- Spec: [TWA-02-browser-telegram-login.md](../features/TWA-02-browser-telegram-login.md)
- Gate run: see the work log `logs/2026-10-31-browser-telegram-login.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` hash and auth_date checked; answer like `/public/auth` | `customer-chat-auth.test.ts` "signs in the same customer as the Mini App for the same Telegram id", "creates the customer on the first browser login" | integration |
| `[Team]` 400 for missing fields, 403 for a wrong hash, changed data or old auth_date | "rejects a wrong hash, changed data and an old auth_date", "answers 400 when fields are missing" | integration |

The tests sign with the bot token the emulator loads (`src/test/emulatorEnv.ts`: `.env`,
`.env.test-project`, `.env.local`), so they also pass when a real token is kept in `.env.local`.

## Not covered

Data signed by Telegram itself (needs a real login on the bot's domain).
