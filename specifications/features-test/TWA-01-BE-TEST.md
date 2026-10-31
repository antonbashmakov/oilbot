# TWA-01-BE — Test spec

- Task: `TWA-01-BE` — Customer token, protected chat API, latest chat history, Firestore index
- Spec: [TWA-01-mini-app-launch.md](../features/TWA-01-mini-app-launch.md)
- Gate run: see the work log `logs/2026-10-31-twa-launch.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` `/public/auth` returns a customer token in body and `__session` | `customer-chat-auth.test.ts` "signs a new Telegram customer in and returns a customer token"; forged hash and expired init data → 403 | integration |
| `[Team]` chat endpoints 401 without a valid customer token, 403 for another customer | "answers 401 without a token", "answers 401 for a staff token", "answers 403 for another customer's token", "accepts the token from the __session cookie" | integration |
| `[Team]` latest 10 messages, oldest first | "returns the latest 10 messages oldest first" (service and endpoint) | integration |
| `[Team]` `CHAT_MESSAGES` index in `firestore.indexes.json`, deployed by `firebase.json` | file review; the emulator does not enforce indexes | manual |
| `[Team]` `/public/auth` no longer logs init data or the profile | code review of `public.ts` and `utils.ts` | manual |
| `[Team]` mock AI in the test emulator | "starts the chat and answers with the mock AI recommendation" | integration |

## Not covered

- The index in production (needs a deploy, Q-07), the real DeepSeek answer, VK sign-in.
- The other integration suites were not run: they hard-code port 5001, held by another project's
  emulators during this task. Unit suites (26 tests) passed.
