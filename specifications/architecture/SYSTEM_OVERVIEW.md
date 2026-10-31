# System overview

Current state of `master`, read from the code on 2026-10-31. Nothing here was run end to end.

## Context

Two Next.js apps on Firebase Hosting call one Firebase Cloud Functions backend that stores data in
Firestore: the staff CRM (`crm/`) and the customer Telegram Mini App (`twa/`). The backend talks to
Telegram, VK, T-Bank and DeepSeek. `bot/` is a separate Telegram bot prototype that calls the
backend API. Layout differences from the stack rules: rule 201.

## Routes

`crm/` (hosting target `crm`, SSR function `ssrposebestoimosti47391`):

| Route | Purpose | Notes |
|---|---|---|
| `/` | Deliveries overview | client components, React Query |
| `/login`, `/signup`, `/approve` | Staff log-in, sign-up, approval | `/api/public/login`, `/api/public/signup` |
| `/deliveries/[id]`, `/deliveries/[id]/process` | Delivery details and processing (picking) | admin and agent APIs |
| `/orders/[id]` | Order details, payments, cancel, consolidate | admin API |

`twa/` (hosting target `twa`, SSR function `ssrtwaprod`):

| Route | Purpose | Notes |
|---|---|---|
| `/` | AI chat with the oil-selection agent | client component; signs in with Telegram init data first (`CustomerSessionProvider`, `SessionGate`), shows a notice outside Telegram |

Redirects and middleware: none (`next.config.ts` of `crm/` only adds next-intl; of `twa/` only
image remote patterns; no `middleware.ts`).

## Source folders

| Folder | Responsibility |
|---|---|
| `crm/src/app` | Routes, layouts, providers |
| `crm/src/components`, `crm/src/stories` | UI components and their Storybook stories |
| `crm/src/api` | openapi-fetch client, React Query hooks, generated types |
| `crm/src/messages`, `crm/src/i18n` | next-intl messages |
| `twa/src/app`, `twa/src/app/components` | Route and chat components |
| `twa/src/api` | openapi-fetch client, React Query hooks, generated types |
| `twa/src/utils` | Auth token storage |

## Backend APIs consumed

| Operation | Contract (owner repository) | Used by |
|---|---|---|
| `/admin/*` (deliveries, orders, pickings, payments, messages, comments, broadcast) | `crm/openapi/api.yml` copy (this repository; backend contract does not describe them, Q-03) | `crm/src/api`, `bot/` |
| `/agent/deliveries/{id}`, `/agent/orders/{id}/deliver` | `crm/openapi/api.yml` copy | `crm/src/api` |
| `/public/login`, `/public/signup`, `/public/users/me` | `crm/openapi/api.yml` copy | `crm/src/api` |
| `authenticateCustomer` `/public/auth` | `functions/resources/openapi/api.yml` (copy in `twa/openapi/`) | `twa/src/api/index.ts` `validateUser` (plain `fetch`) |
| `/private/customers/{customerId}/chats/{chatId}/messages` | `functions/resources/openapi/api.yml` (copy in `twa/openapi/`) | `twa/src/api/index.ts` |
| `performCustomerAction` `/private/customers/{customerId}/actions` | `functions/resources/openapi/api.yml` (copy in `twa/openapi/`) | `twa/src/api/index.ts` `usePerformAction` (`QuestionActionWidget`) |

## Backend

Layout: `functions/` + `crm/` + `twa/` + `bot/` (rules 107, 201). Contract:
`functions/resources/openapi/api.yml`, `models.yml`. Default region `us-central1` (no region set
in code); SSR functions in `europe-west1`.

| Function or module | Trigger | Route prefix | Audience | Services used |
|---|---|---|---|---|
| `public` | HTTPS | `/api/public` | anyone; Telegram/VK init data, staff log-in | `UserService`, `CustomerService` |
| `private` | HTTPS | `/api/private` | customers — customer token (`authorizeCustomer`, Bearer or `__session`) for the customer in the path | `ChatService`, `ChatbotService`, `ProductService` |
| `admin` | HTTPS | `/api/admin` | `ADMIN` (JWT, `authorize`) | order, delivery, payment, messaging, broadcast services |
| `agent` | HTTPS | `/api/agent` | `ADMIN`, `AGENT` | delivery and order services |
| `webhooks` | HTTPS | `/payment` | T-Bank | `PaymentService`, `TBankService` |
| `processOutboxEvent` | Firestore `OUTBOX_EVENTS/{eventId}` create | — | system | processors in `services/events/` |
| `processSubscriptionsDaily` | Pub/Sub schedule `0 0 * * *` UTC | — | system | `SubscriptionService` |
| `api` | HTTPS, emulator only | `/api/<module>` | as the module | all of the above |

| Collection | Holds | Personal data |
|---|---|---|
| `CUSTOMERS`, `CUSTOMER_STATS`, `CUSTOMER_ACCOUNTING` | Customers (with the saved `car` and the 24-hour `car_draft` of a car still being identified; new ids `<ORIGIN>_<external_id>`) and their stats | yes, see PERSONAL_DATA.md |
| `USERS` | Staff accounts | yes |
| `CHAT_MESSAGES`, `CONVERSATION_MESSAGES`, `COMMENTS` | AI chat (assistant messages may carry a `question` with an action), staff–customer messages, comments | yes (free text) |
| `DELIVERIES`, `ORDERS`, `PICKINGS`, `ITEMS`, `ITEM_STATS`, `CART_ITEMS`, `PRODUCTS` | Catalogue and orders | orders link to customers |
| `PAYMENTS`, `CUSTOMER_BALANCES`, `CUSTOMER_BALANCES_CHANGE_EVENTS`, `SUBSCRIPTIONS` | Money | yes |
| `BROADCAST_TASKS`, `BROADCAST_RESULTS` | Broadcasts | recipients |
| `OUTBOX_EVENTS`, `IDEMPOTENT_REQUESTS` | Outbox and idempotency | references |

External systems and their mocks: `TelegramService` / `MockTelegramService`, `TBankService` /
`MockTBankService`, `EventPublisher` / `MockEventPublisher`, `ChatbotService` (DeepSeek) /
`MockChatbotService`; mocks are used when the project id is `test-project`, except the AI when the
emulator runs with `USE_REAL_AI=true` (`yarn serve:ai`, key `DEEPSEEK_API_KEY` from `functions/.env`).

Firestore indexes: `firestore.indexes.json` (`CHAT_MESSAGES`: `owner.id` ASC, `created_at` DESC),
deployed to the default database through `firebase.json` (Q-07).

## Local run (emulators)

No root `dev` script (rule 201.5). `cd functions && yarn serve` builds and starts the functions
emulator; `yarn serve:test` starts Firestore and functions with project `test-project` and the
export in `functions/seed-data/`. Ports: auth 9099, functions 5001, firestore 8080, emulator UI
default. Apps: `yarn dev` in `crm/` or `twa/` on 3000; `twa/.env.development.local` (not committed)
points `NEXT_PUBLIC_BASE_API_URL` at the emulator, `twa/.env.production` (committed) leaves it empty
so production calls `/api/...` on its own origin. Under `next dev` the app signs in outside Telegram
with init data it signs itself with the fake bot token of `twa/.env.development` (matching
`functions/.env.test-project`); `?tgUser=<id>` picks another customer. In a production build
outside Telegram it shows a notice.

## Client state, cookies and storage

`twa/`: the customer token is kept in React state only and sent as `Authorization: Bearer`; the
backend also sets it as the `HttpOnly` cookie `__session`. `twa/src/utils/auth.ts` (localStorage and
readable cookies) is no longer used. React Query cache in both apps. `crm/` token
storage not verified.

## Analytics and third parties

None found: no tag manager, analytics or pixels. `twa/` loads images from
`lh3.googleusercontent.com`; the Telegram Mini App script is not verified.

## Rendering and caching

Pages are client components rendered through Firebase's Next.js SSR functions; no revalidation
settings found. `NEXT_PUBLIC_*` variables are inlined at build time.

## Deployment

Manual: `firebase deploy` with the project from `.firebaserc` (`posebestoimosti-473916` by default,
`posebesto-business` as a second project). `crm` script `deploy` bumps the version, builds and
deploys hosting; `twa` script `deploy` deploys `hosting:twa`. Functions read `functions/.env` and
the deployed environment. No CI.
