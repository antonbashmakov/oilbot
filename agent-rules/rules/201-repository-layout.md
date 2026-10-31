# 201 — Repository layout and emulator setup of oilbot

The repository predates the boilerplate. These rules record where it differs from the stack rules
and what an agent does until each difference is resolved by a task of its own.

- **201.1** Overrides 107.1 and 107.2: the root holds the Firebase configuration and four packages
  instead of `ui/` + `functions/`: `functions/` (backend), `crm/` (staff Next.js app), `twa/`
  (customer Telegram Mini App, Next.js) and `bot/` (Telegram bot prototype). Each has its own
  `package.json` and `yarn.lock`. None of them imports from another; shared shapes come from the
  backend contract (rule 108). Everything 107 says about `ui/` applies to both `crm/` and `twa/`.
- **201.2** Overrides 107.11: hosting has two targets, `crm` (`"source": "crm"`) and `twa`
  (`"source": "twa"`), both with `frameworksBackend` in `europe-west1` and rewrites of
  `/api/public|private|admin|agent/**` to the functions of those modules before the catch-all.
- **201.3** Overrides 107.5 and 107.9: the functions tests and `serve:test` use the project id
  `test-project` (hard-coded in `functions/jest.setup.js` and `functions/src/test/setup.ts`) instead of
  `demo-oilbot`; its emulator values are in `functions/.env.test-project`. Use `test-project` for local runs
  and tests; never run the emulators against `posebestoimosti-473916` or `posebesto-business`.
  Moving to `demo-oilbot` is a task of its own.
- **201.4** Overrides 107.3: `firebase-tools` is not pinned in the root `package.json`; the gate uses
  the `firebase` CLI from `PATH`. Pinning it is a task of its own and needs the developer's word
  (rule 115.5).
- **201.5** Overrides 107.6 and 107.8: there is no root `dev` or `seed` script. Start the functions
  emulator with `cd functions && yarn serve` (or `yarn serve:test` with the committed export in
  `functions/seed-data/`) and each app with `yarn dev` in its folder. `firebase.json` deploys only the
  Firestore indexes; there is no `firestore.rules` or `storage` block, and the Firestore emulator
  uses default rules. Adding rules is a task of its own (rule 115.6). Synthetic emulator secrets are
  in the committed `functions/.env.test-project`.
- **201.6** `twa/` is also a git repository of its own (`antonbashmakov/oilbot-ui`) whose files are
  tracked here as well (Q-01). Commit `twa/` changes in this repository only, and never run git
  commands inside `twa/` without the developer's word.
- **201.7** The API contract copies in `crm/openapi/`, `twa/openapi/` and `bot/resources/openapi/`
  have drifted from `functions/resources/openapi/` (Q-03). When a task changes an endpoint, change
  the backend contract first, then copy it to the apps that call that endpoint and regenerate their
  types (skill `refresh-api-types`).
