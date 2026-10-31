# CAR-02-FE — Test spec

- Task: `CAR-02-FE` — Carousel of car suggestions
- Spec: [CAR-02-car-suggestions.md](../features/CAR-02-car-suggestions.md)
- Gate run: see the work log `logs/2026-10-31-car-suggestions.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` several questions → text then carousel; one question → widget | browser check below; `tsc`, lint | browser, types, lint |
| `[Team]` chosen card saved, others disabled, also after reload | browser check below | browser |

## Browser check

2026-10-31, the developer's running stack (`yarn serve:ai`, `next dev` on 3000, both with the
changes hot-reloaded), dev sign-in `?tgUser=400000001`, real DeepSeek:

- "Skoda Oktavia 1.5L" → message 1: DeepSeek asks for the year and exact engine; message 2:
  "Возможно вам подходит какая-то из этих моделей?"; carousel: Skoda Octavia 2018 / 2020 / 2022
  1.5 TSI 150 л.с., each with "Сохранить".
- "Сохранить" on 2020 → `POST …/actions` 200; that card "Автомобиль сохранён", the others disabled;
  Firestore: `car` = Skoda Octavia 2020 1.5 TSI 150 л.с., draft cleared.
- Reload at 375 px: same state; cards swipe horizontally. Console: no errors.

## Not covered

No automated UI tests; the card error state was not triggered; `yarn build` of `twa/` was not run
for this task (another `next dev` was running in the folder).
