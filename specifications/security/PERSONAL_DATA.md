# Personal data

The project processes personal data of customers (Telegram and VK users in Russia) and of staff.
Federal Law 152-FZ applies (not verified with the developer, Q-06). Rules:
`agent-rules/rules/010-security-personal-data.md`.

## Inventory

| Data | Where stored | Sent to | Source |
|---|---|---|---|
| Customer first and last name, username, language, Telegram/VK id (`external_id`) | `CUSTOMERS` | Telegram (messages), CRM | Telegram/VK init data (`/public/auth`) |
| Telegram/VK init data (signed profile) | not stored, not logged | — | `twa/` |
| Chat texts (car description, questions) | `CHAT_MESSAGES` | DeepSeek | customer in `twa/` |
| Saved car (make, model, year, engine, the customer's description) | `CUSTOMERS.car` | DeepSeek (`saved_car` in every chat request) | `save_car` action |
| Car draft (the customer's car messages of an unfinished identification, 24 hours) | `CUSTOMERS.car_draft` | DeepSeek (`car_tokens`) | chat messages |
| Staff–customer messages, comments | `CONVERSATION_MESSAGES`, `COMMENTS` | Telegram | CRM, customers |
| Orders, delivery and items per customer | `ORDERS`, `PICKINGS`, `CART_ITEMS` | CRM, bot | customers |
| Payments, balances, subscriptions | `PAYMENTS`, `CUSTOMER_BALANCES*`, `SUBSCRIPTIONS` | T-Bank (amount, receipt with support e-mail/phone) | T-Bank, backend |
| Staff e-mail, password hash (bcrypt), roles, JWT | `USERS` | — | `/public/signup` |
| Customer token (JWT with the customer id) | React state in `twa/`; `HttpOnly` cookie `__session` | backend | `POST /public/auth` |

## Handling rules

- No personal data in logs, error responses, metrics, committed fixtures or work logs.
- Chat texts go to DeepSeek; do not add customer profile fields to the AI request without the
  developer's word.
- Retention, deletion and masking: none implemented and no rules recorded (Q-06).

## Open

- Is the committed Firestore export `functions/seed-data/` synthetic? (Q-05)
- Legal basis, retention and transfer of chat texts to DeepSeek (Q-06).
