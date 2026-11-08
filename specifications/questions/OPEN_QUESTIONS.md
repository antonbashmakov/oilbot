# Open questions

Format: `- **Q-NN. Title** (source). Question. Until answered — behaviour to use. Blocks: tasks.`
Numbers are never reused; the next number follows the maximum in "Open" and "Decisions". Re-read
this file right before adding an entry. A partly answered question stays in "Open" with
"(remainder)". Open questions live under `### <group>` headings (for example "Product and
contract", "Environment and security").

## Open

### Repository and environment

- **Q-01. Which repository owns `twa/`?** (SETUP-01-DOC, 2026-10-31). `twa/` is a git repository of
  its own (`antonbashmakov/oilbot-ui`, with uncommitted changes) and its files are also tracked in
  this repository. Which one is the source of truth, and should the nested `.git` go? Until
  answered — commit `twa/` changes here only and run no git commands inside `twa/` (rule 201.6).
  Blocks: none.
- **Q-02. yarn or npm?** (SETUP-01-DOC, 2026-10-31). Every package has both `yarn.lock` and
  `package-lock.json`; `node_modules` were installed by yarn and the root README says `yarn dev`.
  May the `package-lock.json` files be deleted? Until answered — use yarn and leave
  `package-lock.json` untouched (rule 104.1). Blocks: none.
- **Q-05. Is `functions/seed-data/` synthetic?** (SETUP-01-DOC, 2026-10-31). The committed
  Firestore export is used by `serve:test`. Does it hold real customer data? Until answered — do not
  read it into logs or replies and do not add to it (rule 107.8). Blocks: none.

### Product and contract

- **Q-03. Which API contract is the source of truth?** (SETUP-01-DOC, 2026-10-31).
  `functions/resources/openapi/api.yml` describes only the private chat endpoints; the admin,
  agent and public endpoints are described only in the copy `crm/openapi/api.yml`; `/public/auth`
  is in no contract. Should the backend contract be completed from the CRM copy? Until answered —
  the backend contract is ours (rule 201.7); a task that touches an endpoint adds it there.
  Blocks: none.
- **Q-07. Which Firestore database does production use?** (remainder) Found 2026-11-08: the shop
  project `posebestoimosti-473916` has `(default)`, `posebestoimosti` and `posebestoimosti-clone`
  in `europe-north2`; OilMatch (`oilmatch-prod`) uses `(default)`. Still open for the shop: which
  one `DATABASE_ID` names in its deployed functions. (TWA-01-BE, 2026-10-31). The functions
  read `DATABASE_ID` (default `(default)`); the new `CHAT_MESSAGES` index in
  `firestore.indexes.json` is deployed to the default database. If production sets `DATABASE_ID`,
  `firebase.json` must name that database. Until answered — default database. Blocks: deploying
  TWA-01-BE.
- **Q-04. Product scope of `master`** (SETUP-01-DOC, 2026-10-31). The PRD was written from the code.
  Is the AI oil-selection chat an addition to the delivery shop or a new product, and are there
  tracker tasks for it? Until answered — the PRD describes both as in scope. Blocks: none.
- **Q-06. Personal data rules** (SETUP-01-DOC, 2026-10-31). Does 152-FZ apply, what is the
  retention for chats, orders and payments, and is sending chat texts to DeepSeek agreed? Until
  answered — send nothing beyond chat texts and product data to DeepSeek; no new personal data
  fields. Blocks: none.

## Decisions

| ID | Question | Decision | Where applied |
|---|---|---|---|
