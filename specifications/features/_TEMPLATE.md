# <EPIC-ID> — <Title>

<!-- Status and progress live only in FEATURE_REGISTRY.yaml. After creating a spec run
     python3 agent-rules/scripts/gen_spec_index.py. Delete sections that do not apply. -->

## Tasks

| Task | Surface | Tracker |
|---|---|---|
| `<EPIC-ID>-FE` | frontend | `<id>` |

## Context

Why the feature exists; links to `../product/source-tasks/<id>.md` and the PRD section.

## Scope

In scope. Out of scope (explicitly).

## Business rules

Numbered rules with source labels (`[<TRK>-<id>]`, `[API]`, `[Q-NN]`, `[Team]`). Anything undefined:
"undefined — see Q-NN".

## Pages and routes

Routes added or changed, redirects, who reaches them and from where (links, e-mails, partners).

## UI states

Loading, empty, error, success; partner, theme or language variants; mobile and desktop.

## API calls

Operations used (operationId, contract repository), status codes handled, cache keys and
invalidation (`../integrations/<SYSTEM>.md` for third parties).

## Analytics and third parties

Events sent (name, properties), scripts, iframes; no personal data (rule 110.3).

## Personal data

Which personal data the feature collects, sends, stores in cookies or storage
(`../security/PERSONAL_DATA.md`).

## Copy and content

Source of the texts and documents (task, legal, marketing), languages.

## Tests

Link to `../features-test/<TASK-ID>-TEST.md`.

## Known issues

Links to `../bugs/BUGS.md`.

## Open questions

Links to `../questions/OPEN_QUESTIONS.md`.
