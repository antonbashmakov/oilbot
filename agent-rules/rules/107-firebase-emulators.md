# 107 — Firebase layout and local emulators (nextjs)

Applies when the project is deployed on Firebase (`firebase.json` at the repository root).

## Layout

- **107.1** The repository root holds only the Firebase configuration and the two packages:

  | Path | Holds |
  |---|---|
  | `firebase.json`, `.firebaserc` | Functions, hosting, emulators (107.4); project aliases |
  | `firestore.rules`, `firestore.indexes.json` | Security rules (107.10) and indexes |
  | `functions/` | Cloud Functions in TypeScript, laid out by rule 106; own `package.json` and lock file |
  | `ui/` | The Next.js app (rules 105, 108, 110); own `package.json` and lock file |
  | `package.json` | Scripts that start and test both packages and `firebase-tools` as a dev dependency; no runtime code |

- **107.2** `ui/` never imports from `functions/` and `functions/` never imports from `ui/`; shared
  shapes come from the backend contract (106.13, 108).
- **107.3** Run the Firebase CLI from the root `package.json` (`npx firebase …`) so every session uses
  the pinned `firebase-tools` version (rule 104), not a global install.

## Running locally on the emulators

- **107.4** The whole project runs on the Firebase Local Emulator Suite without any cloud resource.
  `firebase.json` has an `emulators` block with fixed ports for every Firebase product the project
  uses (at least `auth`, `functions` and `firestore`; `pubsub`, `storage`, `hosting` when used),
  `ui.enabled: true` and `singleProjectMode: true`.
- **107.5** Local runs and tests use the demo project id `demo-<project-slug>`
  (`EMULATOR_PROJECT` in `agent-rules/project.sh`): `npx firebase emulators:start --project
  demo-<slug>`. A demo project has no cloud counterpart, so nothing reaches a real project and a
  product without an emulator fails instead of touching production. With it, `isEmulated()` is true
  (106.10) and external systems use their mock services (106.8). Never run the emulators against
  the production project id.
- **107.6** One command starts everything: `<PKG> run dev` at the root builds the functions in
  watch mode, starts the emulators and starts `next dev` in `ui/`. The UI reaches the backend through
  the emulator-only function `api` (106.11): `ui/.env.development` (committed, no secrets) sets
  `NEXT_PUBLIC_BASE_API_URL=http://127.0.0.1:<functions port>/demo-<slug>/<region>/api`. A UI
  that uses the Firebase client SDK connects it to the emulators (`connectAuthEmulator`,
  `connectFirestoreEmulator`) when `NEXT_PUBLIC_USE_EMULATORS=true`.
- **107.7** The functions emulator loads the compiled code from `functions/lib/`: build before
  starting it (the `dev` script runs `tsc --watch`), and after a change check that the emulator
  reloaded it before testing.
- **107.8** Local data is synthetic: `<PKG> run seed` writes it to the Firestore and Auth emulators
  with the Admin SDK (`functions/src/scripts/seed.ts`), and refuses to run when
  `FIRESTORE_EMULATOR_HOST` is not set. Exported emulator data (`--export-on-exit`) stays out of git
  unless it is synthetic and the developer agreed to commit it.
- **107.9** Configuration of functions: values for the emulator are in `functions/.env.demo-<slug>`
  (committed, synthetic, no secrets — Firebase loads `.env.<projectId>`). Production values come
  from `functions/.env.<alias>` files that are not committed or from Secret Manager (`defineSecret`);
  `functions/.secret.local` and `.env.local` override them in the emulator and are never committed
  (rule 110.2).

## Security rules, deployment and housekeeping

- **107.10** When every read and write goes through the functions (rule 106), `firestore.rules`
  denies all client access. Opening a path to the client SDK is a change of its own: rules written
  for it and tested on the Firestore emulator, and confirmed by the developer (rule 115).
- **107.11** Hosting serves `ui/` (`"source": "ui"`, `frameworksBackend` with a fixed region); its
  rewrites send `/api/<module>/**` to the function of that module before the catch-all `**`. Changes
  to `firebase.json`, `.firebaserc`, rules and indexes need confirmation (rule 115).
- **107.12** The emulators need Node.js (the `engines.node` of `functions/package.json`) and the Java
  version the pinned `firebase-tools` requires. Start your own emulators, note the PID and stop them by
  it (014.4); emulator ports that are already taken belong to another session (014.5): ask, or run
  your emulators with other ports in a copy of `firebase.json` passed with `--config`.
