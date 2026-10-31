# 106 — Node.js backend: controllers, services, imports (nextjs)

Applies when the repository has its own Node.js backend: Firebase Cloud Functions in `functions/`
(rule 107) or a server package on Express, Fastify or a similar framework. A Next.js app without its
own backend skips this rule; its route handlers stay thin (105.2, 108.6).

## Layers

- **106.1** The backend source (`functions/src/` with Firebase, `src/` of the server package
  otherwise) has these folders and nothing else at the top level apart from `index.ts`, `db.ts`,
  `auth.ts`, `env.ts` and `constants.ts`:

  | Folder | Holds |
  |---|---|
  | `controllers/<module>/` | Receives calls from clients and triggers, calls services, shapes the response |
  | `services/` | Data access (DAO) and external systems: the only code that talks to the database or a third party |
  | `services/events/` | Processors of outbox events (106.12) |
  | `models/` | Entity and DTO types; generated contract types are re-exported from here (106.11) |
  | `middleware/` | Express middleware shared by modules (locale, authorization) |
  | `scripts/` | Local tooling such as the emulator seed (rule 107.8) |
  | `test/` | `setup.ts`, `unit/`, `integration/` (rule 111) |

- **106.2** Dependencies point one way: `index.ts` → `controllers` → `services` → database or SDK.
  A service never imports a controller; a controller never touches the database, a collection or a
  query directly; `models/` and `constants.ts` import nothing from the other folders.

## Controller modules

- **106.3** A controller module is a folder of exactly three files:
  - `index.ts` re-exports the module's entry, for example `export {default as publicApi} from "./public";`
  - `imports.ts` imports every dependency of the module — framework, SDKs, services, constants,
    helpers — and re-exports them. It is the single place where a real implementation is replaced by
    its test double (106.8);
  - `<module>.ts` defines the Express app or the triggers and imports its dependencies only from
    `./imports` (types from `../../models` are the exception).

  ```ts
  // controllers/private/imports.ts
  import express from "express";
  import cors from "cors";
  import {firestore} from "../../db";
  import {isEmulated} from "../../env";
  import {api} from "../../services/utils";
  import {authorize} from "../../middleware/authorize";
  import ItemService from "../../services/ItemService";
  import RealPaymentService from "../../services/payments/PaymentService";
  import MockPaymentService from "../../services/payments/MockPaymentService";

  const PaymentService = isEmulated() ? MockPaymentService : RealPaymentService;

  export {express, cors, firestore, api, authorize, ItemService, PaymentService};
  ```

- **106.4** One module per audience or trigger kind, mounted under `/api/<module>`: `public` (no
  sign-in), `private` (signed-in user), `admin` (role-checked), `webhook` (third-party callbacks,
  signature verified first), `db` (Firestore, Pub/Sub and scheduled triggers). A new route goes to
  the module of its audience; a new module only for a new audience or trigger kind (skill
  `add-endpoint`).
- **106.5** A controller handler validates the input, checks authentication and roles, calls
  services, and answers with the shared `api` helper (`api.send`, `api.ok`, `api.badRequest`,
  `api.unauthorized`, `api.forbidden`, `api.notFound`, `api.error`, and `api.failure` in the catch
  block); error bodies are
  `{error: {code, message}}`. Every handler catches its errors, logs them with the functions logger
  and answers without internal details (005.5). Business rules that span several services live in a
  service, not in the handler.
- **106.6** Services are created once per module, at the top of `<module>.ts`, from the shared
  database handle: `const db = firestore(); const itemService = new ItemService(db);`. Controllers
  never call `admin.initializeApp()`, `db.settings()` or `new Firestore()` themselves (106.10).

## Services

- **106.7** One service per collection or table: `class <Entity>Service extends
  AbstractService<Entity>`, with its collection name from `COLLECTIONS` in `constants.ts`. The
  database handle comes through the constructor; the service never creates it. Queries,
  transactions, batched writes, increments and the mapping of stored documents to plain objects
  (string ids, timestamps to `Date`) live in the service and nowhere else.
- **106.8** A service for an external system (payments, messaging, e-mail) has a mock implementation
  `Mock<Name>Service` with the same public methods, next to it. The real one is replaced by the mock
  only in an `imports.ts` (106.3) or a service's own imports file (106.9), with the check
  `isEmulated()` from `env.ts` — never with `if` checks inside handlers or services, and never with
  `exports.X = …` reassignments.
- **106.9** A service that depends on other services or on external systems imports them through its
  own file `<Name>Service.import.ts`, by the same rules as a controller's `imports.ts`.

## Entry point, database handle and contracts

- **106.10** `db.ts` initializes the Admin SDK once and exports `firestore()`, which applies
  `DATABASE_ID` when the project uses a named database; `auth.ts` exports `auth()` and is imported
  only where the Auth SDK is needed (middleware, seed), because it loads ES modules that Jest on
  Node 22 cannot require. `env.ts` exports `isEmulated()`: true when
  the project id starts with `demo-` (the emulator project, rule 107.3), which a deployed function
  never has.
- **106.11** `index.ts` only wires: one HTTPS function per HTTP module, named after it, that strips
  the `/api/<module>` prefix and hands the request to the module's app; the triggers of `db`; and,
  under the emulator only, the function `api` that routes `/<module>/…` to each module for the local
  UI (rule 107.6). No logic in `index.ts`.
- **106.12** A state change that must cause a side effect (a message, a charge, another write)
  writes an outbox event in the same transaction; a `db` trigger hands it to its processor in
  `services/events/`. Processors are idempotent and record failures and retries on the event.
- **106.13** The HTTP API is described in an OpenAPI contract owned by the backend
  (`functions/resources/openapi/api.yml`, listed in `CONTRACTS`); types are generated from it into
  `src/openapi/` and re-exported from `models/`. The UI copies the contract and generates its own
  types (rule 108); a change of the API starts with the contract.

## Other Node.js frameworks

- **106.14** A backend on Express, Fastify or Koa outside Firebase follows the same layers, the same
  three files per module and the same `db.ts` and `env.ts`, with `isEmulated()` replaced by the
  project's test or local environment check. A framework with its own dependency injection (NestJS)
  keeps controllers and services as above but swaps test doubles through its container instead of
  `imports.ts`.
