# TWA-03 — Russian interface texts

## Tasks

| Task | Surface | Tracker |
|---|---|---|
| `TWA-03-FE` | frontend | — |

## Context

The developer's request (chat, 2026-11-08): translate the interface texts of the Mini App to
Russian using i18n, and comment out the filter buttons under the product carousel for now.

## Scope

In scope: all texts of `twa/src/app` (header, chat banner, input, typing indicator, product card,
checkout sheet, sign-in screens, save widgets), aria labels and placeholders, the page title and
language, date and time formats in the chat. Out of scope: AI answers and backend texts (already
Russian), other languages, the demo values the components show (the header's car "Škoda", the
footer's "VW 504 00" and "4,5 л", the rating "5 (10 отзывов)"), which are placeholders.

## Business rules

1. `[Team]` Texts live in `twa/messages/ru.json`, grouped by component, and are read with
   `useTranslations`; message keys are type-checked (`src/types/next-intl.d.ts`).
2. `[Team]` Locale `ru` only; `<html lang="ru">`; dates and times through next-intl's formatter.
3. `[Team]` The filter buttons are commented out, with their texts already in Russian.

## Tests

[TWA-03-FE-TEST.md](../features-test/TWA-03-FE-TEST.md).

## Open questions

None.
