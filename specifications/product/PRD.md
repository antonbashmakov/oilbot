# PRD — oilbot

First version written from the code on `master` while adopting the agent workflow (SETUP-01-DOC,
2026-10-31). No tracker task texts are recorded yet; everything below describes the current state
and is to be confirmed by the developer (Q-04).

## 1. Purpose

"Posebestoimosti" sells goods to customers in scheduled deliveries. Customers come through
Telegram (and VK, in progress): they browse items, put them in a cart, order for a delivery, pay
through T-Bank and can hold a paid subscription (membership with member prices). Staff plan
deliveries, collect and consolidate orders, take payments, message customers and send broadcasts.
The current work adds an AI chat in the Telegram Mini App that asks for the customer's car and
recommends motor oil from the shop's products.

## 2. Actors and systems

| Actor or system | Role |
|---|---|
| Customer | Uses the Telegram Mini App (`twa/`); identified by Telegram or VK init data |
| Admin (`ADMIN`) | Uses the CRM (`crm/`): deliveries, orders, pickings, payments, comments, messages, broadcasts |
| Delivery agent (`AGENT`) | Uses the CRM to see a delivery and mark orders delivered |
| Telegram | Mini App host, init data, bot messages and broadcasts |
| VK | Mini App init data (`VK_SECRET_KEY`); messaging to VK customers is disabled |
| T-Bank (Tinkoff) | Payments, recurring subscription charges, receipts, payment webhook |
| DeepSeek | Chat completions for the oil-selection agent (`openai` SDK) |

## 3. Scope

In scope: customer sign-in through Telegram/VK init data; staff sign-up, approval and log-in;
items, cart, orders, deliveries, order picking and consolidation; payments, balances and
subscriptions; customer messages, comments and broadcasts; the AI oil-selection chat.
Out of scope (not found in the code): other payment providers in production (`sbp-implementation`
branch is not merged), a customer web shop outside Telegram.

## 4. Domain

- **Delivery** — a scheduled run with an order deadline and a delivery window; holds orders.
- **Order** — a customer's items for one delivery; created from the cart, paid, picked
  (`ORDER_PICKINGS`), consolidated, conciliated, resolved, delivered or cancelled. State changes
  publish outbox events (`OUTBOX_EVENTS`) processed by `processOutboxEvent`.
- **Payment** — a T-Bank payment for an order or a subscription; confirmed or failed by webhook.
- **Customer balance** — money held per customer, changed by `BALANCE_CHANGED` events.
- **Subscription** — a paid membership charged daily by `processSubscriptionsDaily`; cancelled
  after the first failed charge.
- **Chat message** — a message between a customer and the AI agent (`CHAT_MESSAGES`); the agent
  answers with product ids from `PRODUCTS`.

## 5. Non-functional requirements

- Personal data of customers in Russia (152-FZ, not verified, Q-06); see
  [PERSONAL_DATA.md](../security/PERSONAL_DATA.md).
- Payments must be idempotent (`IDEMPOTENT_REQUESTS`, `IdempotencyGuardService`) and every money
  movement traceable through outbox events.
- Customer chat texts are sent to DeepSeek; no other availability, performance or audit
  requirements are recorded.
