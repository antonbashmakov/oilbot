---
name: firebase-scaffold
description: Set up or restructure a Firebase project the stack's way — UI in ui/, Cloud Functions in functions/ split into controllers, imports files and services, emulator config, seed and integration tests, runnable locally on the Firebase emulators with the demo project. Use when a repository starts a Firebase backend, when an existing Firebase project is moved to the ui/ + functions/ layout, or when asked to make the project run on the emulators.
---

# Firebase scaffold: ui/ + functions/ on the emulators

Rules: `106-node-backend.md`, `107-firebase-emulators.md`, `111-testing.md` (111.7–111.9),
`115-protected-files.md` (115.6).

The templates in `templates/` are a working example: two HTTP modules (`public`, `private`), one
collection service, Firebase Auth token checks, an emulator-only `api` entry point for the UI, a
seed script and integration tests on the emulators. `scaffold.py` writes them; it never overwrites
an existing file.

## Steps

1. **Agree the scope with the developer.** The scaffold changes protected files (`firebase.json`,
   `.firebaserc`, rules; 115.6): show the plan first and wait for a yes. A restructuring of an
   existing project is a task of its own (rule 005).
2. **Pick the slug and region.** The slug names the demo project `demo-<slug>` (107.5); take it from
   `PROJECT_SLUG` in `agent-rules/project.sh`. The region is the one of the existing functions, or
   the developer's choice.
3. **Dry run, then write:**

       python3 .claude/skills/firebase-scaffold/scaffold.py --slug <slug> --region <region> --dry-run .
       python3 .claude/skills/firebase-scaffold/scaffold.py --slug <slug> --region <region> .

   Every `exists` line is a file to merge by hand: keep the project's content and add what the
   rules need (the `emulators` block, the `/api/<module>/**` rewrites, the `.gitignore` lines).
4. **The UI.** A new project: create the Next.js app in `ui/` (`npx create-next-app@<version> ui`,
   version per rule 104). An existing Next.js app at the root or in another folder (`crm/`, `web/`):
   move it to `ui/` with `git mv` so history is kept, and fix paths in CI, `firebase.json` and
   scripts. The UI calls the backend only through its API module (105.4) with
   `NEXT_PUBLIC_BASE_API_URL` from `ui/.env.development` / `.env.production`.
5. **An existing backend.** Move it into the layers of rule 106, module by module, in separate
   commits: for each controller module create `index.ts`, `imports.ts` and `<module>.ts`; move every
   database call out of handlers into a service; replace `admin.initializeApp()` and `db.settings()`
   calls in modules with `firestore()` from `db.ts`; replace mock switches (`exports.X = Mock…`,
   `GCLOUD_PROJECT === "test-project"`) with `isEmulated()` selections in `imports.ts`; keep the
   behaviour and the URLs the UI and the hosting rewrites use. Run the integration tests after each
   module.
6. **Install** with the package manager of rule 104 in the root, `functions/` and `ui/`. The root
   `package.json` pins `firebase-tools`; the templates use `npm --prefix` in scripts — switch them to
   the project's package manager.
7. **Generate the contract types** (`npm --prefix functions run openapi`) after changing
   `functions/resources/openapi/api.yml`, and add the contract to `CONTRACTS` in `project.sh`.
8. **Run it** (skill `run-emulators`): `npm test` at the root runs the integration tests inside the
   emulators; `npm run dev` starts functions, emulators and UI; `npm run seed` adds the demo data.
   Hosting with `"source": "ui"` needs `firebase experiments:enable webframeworks` before a deploy or
   a hosting emulator; the local run does not use it.
9. **Gate and specifications:** fill rule 104 (layout, backend versions, Java), `project.sh`
   (`PROJECT_SLUG`, `PKG`, `NODE_MAJOR`; the Firebase branch of `BUILD_STEPS` is picked up when
   `firebase.json` and `functions/` exist), `SYSTEM_OVERVIEW.md` (Backend and Local run sections),
   then run the gate.

## What the templates show

| Template | Rule |
|---|---|
| `functions/src/controllers/<module>/{index,imports,<module>}.ts` | 106.3–106.6 |
| `functions/src/services/AbstractService.ts`, `ItemService.ts`, `utils.ts` | 106.5, 106.7 |
| `functions/src/db.ts`, `auth.ts`, `env.ts`, `index.ts` | 106.10, 106.11 |
| `functions/src/middleware/authorize.ts` | 106.4, 110.9 |
| `functions/src/scripts/seed.ts` | 107.8 |
| `functions/src/test/setup.ts`, `test/integration/items.test.ts`, `jest.*` | 111.7, 111.9 |
| `firebase.json`, `.firebaserc`, `firestore.rules`, root `package.json` | 107.4–107.6, 107.10, 107.11 |
| `functions/.env.demo-<slug>`, `ui/.env.development`, `ui/.env.production`, `.gitignore` | 107.6, 107.9, 110.2 |
