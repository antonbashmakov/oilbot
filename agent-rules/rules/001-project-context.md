# 001 — Project context

## Product

- **001.1** `oilbot` (Firebase project `posebestoimosti-473916`, brand "Posebestoimosti") serves
  customers of a delivery-based shop and the staff who run it. Customers use a Telegram Mini App
  (`twa/`); staff (roles `ADMIN`, `AGENT`) use the CRM (`crm/`). `bot/` is a standalone Telegram
  bot prototype (long polling, test bot) that shows catalogue items to customers; whether it runs
  anywhere is not verified. The backend (`functions/`) receives data from Telegram and VK (Mini App
  init data), T-Bank (Tinkoff) payment webhooks and DeepSeek (AI answers), and sends data to
  Telegram (messages and broadcasts), T-Bank (payments, recurring charges, receipts) and DeepSeek
  (chat history and the product list).
- **001.2** The current work line (`master`) adds an AI chat in the Mini App: an agent that picks
  motor oil for the customer's car only from the products in `PRODUCTS`
  (`functions/src/prompts/oilagent.ts`, `ChatbotService`). External systems have mock services
  chosen in the emulator (`MockTelegramService`, `MockTBankService`, `MockEventPublisher`);
  `ChatbotService` has no mock yet.
- **001.3** The project processes personal data of customers (Telegram/VK profile, chat texts,
  orders, payments) and staff (e-mail, password hash). Customers are in Russia: Federal Law 152-FZ
  on personal data applies (not verified with the developer, Q-06). See
  `010-security-personal-data.md` and `specifications/security/PERSONAL_DATA.md`.

## Repository

- **001.4** This repository contains everything an agent needs: code, agent rules (`agent-rules/`)
  and the knowledge base (`specifications/`). Open the repository root so that `AGENTS.md` is loaded.
- **001.5** Take the whole repository into account, but keep responsibilities apart: backend in
  `functions/`, staff UI in `crm/`, customer Mini App in `twa/`, bot prototype in `bot/`, rules in
  `agent-rules/`, knowledge in `specifications/`.
- **001.6** Package names: `functions`, `crm`, `oil-bot` (`twa/`), `bot`. No old names to avoid.
- **001.7** Backend code organisation follows rule 106: one Express app per audience in
  `functions/src/controllers/<module>/` (`public`, `private`, `admin`, `agent`, `webhook`, plus `db`
  for Firestore and scheduled triggers), data access in `functions/src/services/`, outbox processors
  in `functions/src/services/events/`, AI prompts in `functions/src/prompts/`. The Next.js apps use
  the App Router in `src/app/`; API clients in `src/api/`.
- **001.8** The backend contract is `functions/resources/openapi/api.yml` and `models.yml`; types
  are generated into `functions/src/openapi/`. `crm/openapi/`, `twa/openapi/` and
  `bot/resources/openapi/` are consumer copies with their own generated types; they have drifted
  from the backend contract (Q-03).
- **001.9** Branches compared during sync (rule 013.4): `master` (current work) and
  `origin/create-account-sms` (the remote default branch).

## Existing automation

- **001.10** No CI pipelines or bots work on this repository. Deployment is manual with the Firebase
  CLI (`firebase deploy`, `crm` script `deploy`, `twa` script `deploy`), only on the developer's word
  (rule 115). `twa/AGENTS.md` and `twa/CLAUDE.md` are written by `next dev` for the Next.js version
  of `twa/`; read them before working in `twa/`. `.cursorrules` is generated from `AGENTS.md` and
  `agent-rules/rules/` (rule 016.11), so tools that read it follow the same rules.
- **001.11** If rules disagree, apply the stricter one and state the assumption explicitly; a project
  rule (`2xx`) overrides another rule only where it names it (rule 019.4).
