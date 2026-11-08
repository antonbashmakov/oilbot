# 115 — Protected setup, deployment and production files (nextjs)

Changing any of these needs the developer's explicit confirmation (rule 015).

- **115.1** CI: none exists. Nothing deploys on push; every deployment is a manual `firebase deploy`.
- **115.2** Setup and deployment: the `deploy`, `bump-version` and `prebuild` scripts of
  `crm/package.json` and `crm/scripts/`, the `deploy` scripts of `twa/package.json` and
  `functions/package.json`, `.vscode/` and `functions/.vscode/` launch settings.
- **115.3** Production routing and security: `crm/next.config.ts`, `twa/next.config.ts` (image
  remote patterns), the CORS settings and auth middleware of every controller in
  `functions/src/controllers/`.
- **115.4** Environment files and secrets: `functions/.env` (T-Bank terminal credentials, DeepSeek
  API key), `functions/.env.test-project`, `twa/.env.development`, `twa/.env.development.local`, `twa/.env.production`, and
  the environment variables of the deployed functions. Never read
  their values into logs, work logs or replies.
- **115.5** Package manager configuration (`.npmrc`, `.yarnrc*`), `engines`, `resolutions` or
  `overrides` in any `package.json`.
- **115.6** Firebase: `firebase.json` (hosting targets `crm` and `twa`, rewrites, SSR functions),
  `.firebaserc` (projects `posebestoimosti-473916` and `posebesto-business`; alias `oilmatch` → `oilmatch-prod`), `firebase.oilmatch.json`, `firestore.indexes.json`,
  the `engines` of `functions/package.json`, the `functions/.env*` files and the secrets set with
  `firebase functions:secrets:set` (rule 107). Never deploy (`firebase deploy`) without the
  developer's explicit word.
- **115.7** Project-specific: `functions/seed-data/` (committed Firestore export used by
  `serve:test`, Q-05), the AI prompts in `functions/src/prompts/` (change product behaviour for every
  customer), the T-Bank payment and webhook code (`functions/src/services/payments/`,
  `functions/src/controllers/webhook/`), the scheduled subscription charge
  (`processSubscriptionsDaily`), and the Telegram bot token and broadcast code.
