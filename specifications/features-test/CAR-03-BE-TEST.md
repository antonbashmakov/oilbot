# CAR-03-BE — Test spec

- Task: `CAR-03-BE` — Confirmation message and the oil search endpoint
- Spec: [CAR-03-oil-search-after-save.md](../features/CAR-03-oil-search-after-save.md)
- Gate run: see the work log `logs/2026-10-31-oil-search-after-save.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` suggestions carry `follow_up`; saving one returns the stored confirmation and `follow_up` | `customer-saved-car.test.ts` "suggests probable cars in a second message while details are missing", "confirms a saved suggestion and searches oil for it" | integration |
| `[Team]` oil search answers for the saved car without storing a user message; 400 without a saved car | "confirms a saved suggestion and searches oil for it", "answers 400 to an oil search without a saved car" | integration |

## Not covered

DeepSeek's answer to the oil search request (model output).
