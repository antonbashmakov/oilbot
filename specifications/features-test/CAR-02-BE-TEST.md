# CAR-02-BE — Test spec

- Task: `CAR-02-BE` — AI car suggestions and the questions array
- Spec: [CAR-02-car-suggestions.md](../features/CAR-02-car-suggestions.md)
- Gate run: see the work log `logs/2026-10-31-car-suggestions.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` `questions` array replaces `question` | all `customer-saved-car.test.ts` cases use `questions` | integration |
| `[Team]` up to 3 suggestions with `need_more_info` | mock: two suggestions; real DeepSeek: three for "Skoda Oktavia 1.5L" (browser check in `CAR-02-FE-TEST.md`) | integration, browser |
| `[Team]` suggestions message after the answer, only without a saved car | "suggests probable cars in a second message while details are missing", "does not suggest cars when the message names no car or the customer has a saved car" | integration |
| `[Team]` choosing saves the car, clears the draft, marks only that option | "saves the chosen suggestion, ends the identification and marks only that option answered" | integration |

## Not covered

The quality of DeepSeek's suggestions (model output); checked once in the browser.
