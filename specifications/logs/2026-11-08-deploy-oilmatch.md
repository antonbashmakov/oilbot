# 2026-11-08 — Deploy the AI chat to Firebase as OilMatch (app.oilmatch.ru)

## Plan

- Source: the developer's request in chat (deploy the application to Firebase, connect
  app.oilmatch.ru). Deploying is allowed only on the developer's word (rule 115.6); given.
- Finding: both existing projects (`posebestoimosti-473916`, `posebesto-business`) run the live shop
  backend (`private` with cart, orders, subscriptions, and the other modules). `master`'s `private`
  serves only the chat, so deploying `master` there would break the shop's Mini App. The developer
  chose a new project.
- New project `oilmatch-prod` ("OilMatch"); Firestore `(default)` in `europe-north2`, as the shop
  (`posebestoimosti-473916` uses `europe-north2`, with the named database `posebestoimosti`, Q-07).
- Separate deploy config `firebase.oilmatch.json` (functions with predeploy build only — lint has
  existing errors; Firestore indexes; hosting target `twa` without the hand-written `**` rewrite,
  which the frameworks integration adds for the site's own SSR function); alias `oilmatch` and
  target `twa` → site `oilmatch-prod` in `.firebaserc`; `functions/.env.oilmatch-prod` (never
  committed) with `DATABASE_ID=(default)`, a generated `JWT_SECRET` and the bot token.
- Deploy: `firebase deploy --config firebase.oilmatch.json --project oilmatch-prod --only
  functions,firestore:indexes,hosting:twa`.
- Custom domain app.oilmatch.ru on the hosting site; DNS records by the developer.

## Done

- Project `oilmatch-prod` created (Firebase CLI, developer's account).
- `firebase.oilmatch.json`, `.firebaserc` alias and target, `functions/.env.oilmatch-prod` prepared.

- The developer chose `@PoSebestoiosti_test_bot` as the OilMatch bot: token in
  `functions/.env.oilmatch-prod`, username and Mini App link `https://t.me/PoSebestoiosti_test_bot/app`
  in `twa/.env.production`; Blaze plan enabled by the developer.
- Firestore API enabled by a first `firestore:indexes` deploy; database `(default)` created in
  `europe-north2` with the CLI (closed client rules; only the functions use it).
- Fix: every controller called `db.settings({databaseId: DATABASE_ID})` on the shared default
  Firestore when its id differed from `DATABASE_ID`; during the deploy's code analysis the
  `.env.<project>` file is not loaded, so `DATABASE_ID` was unset, the first module set `undefined`
  and the second crashed ("Firestore has already been initialized"). The six controllers now skip
  `settings()` when `DATABASE_ID` is unset (runtime unchanged: OilMatch `(default)` never calls it,
  the shop's `posebestoimosti` is set by the first module as before).
- Cleanup policy for function images in `us-central1`: 1 day
  (`firebase functions:artifacts:setpolicy`).
- Deployed 2026-11-08: Firestore indexes; functions `private`, `public`, `admin`, `agent`,
  `webhooks`, `processOutboxEvent`, `processSubscriptionsDaily` (1st gen, Node.js 22,
  `us-central1`); hosting site `oilmatch-prod` → https://oilmatch-prod.web.app (the app builds as
  static pages, so no SSR function was created).

## Checks

- Before the deploy: the built functions load with `GCLOUD_PROJECT=oilmatch-prod` and no
  `DATABASE_ID` (all seven exports); `tsc` OK.
- Live, 2026-11-08: `GET /` 200, loads `telegram-web-app.js`; `POST /api/public/auth` and
  `/api/public/auth/telegram-login` with an empty body → 400 from the functions; `GET
  /api/private/customers/x/chats/latest/messages` without a token → 401. The client files carry
  the bot username and neither `127.0.0.1:5001` nor the test token.
- Not checked: a sign-in inside Telegram (BotFather still points the Mini App and login domain
  elsewhere); the custom domain.

## Open

- app.oilmatch.ru: custom domain in the Firebase console and DNS records at the registrar
  (developer); then BotFather Mini App URL and `/setdomain` → app.oilmatch.ru.
- ~~`PRODUCTS` is empty in `oilmatch-prod`~~ — loaded 2026-11-08, see below.

## Products (2026-11-08)

- On the developer's request, the `PRODUCTS` collection of `functions/seed-data` (15 documents:
  9 oils with SAE/ACEA/API/OEM specs, 6 other products without specs) was read through a
  Firestore emulator started with `--import` and written to `oilmatch-prod` with the original ids
  (Firestore REST, the Firebase CLI's signed-in account; dry run first: 0 before, 15 after).
  `CUSTOMERS` and `CHAT_MESSAGES` of the seed data were not copied.

## Findings and decisions

- Deploy attempts that failed and why: Spark plan (Cloud Build needs Blaze); the code-analysis
  crash above; the Firebase Extensions API needing minutes after being enabled; a first function
  creation failure on the new project (passed on retry); the missing image cleanup policy.
