# CAR-01-FE — Test spec

- Task: `CAR-01-FE` — QuestionActionWidget in the chat
- Spec: [CAR-01-saved-car.md](../features/CAR-01-saved-car.md)
- Gate run: see the work log `logs/2026-10-31-saved-car.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` widget with question and button, done state when answered | browser check below; `tsc`, lint | browser, types, lint |
| `[Team]` button sends type, params, message_id; disabled while sending; done or error state | browser check (network: `POST …/actions` 200); code review of `QuestionActionWidget.tsx` for the error state | browser, manual |

## Browser check

2026-10-31, `next dev` on port 3107 with the dev sign-in against the emulators (`test-project`,
ports 5101/8180, `USE_REAL_AI=true`, one synthetic oil with VW 504 00 / 507 00), desktop width:

- `?tgUser=200000001`: "Volkswagen Golf 2015 1.4 TSI" → DeepSeek recommended the oil and the widget
  "Хотите сохранить автомобиль в системе?" with "Сохранить" appeared under the card; click →
  `POST /api/private/customers/{id}/actions` 200; Firestore: `car` = Volkswagen Golf 2015 1.4 TSI.
  The widget disappeared on the refetch (fixed: answered questions now show the done state) and a
  reload showed an empty chat because two customers had been created (BUG-005, fixed).
- After both fixes, `?tgUser=200000002`: "Skoda Octavia 2018 1.8 TSI" → DeepSeek asked for the engine
  code and service interval, with the save question; click → "Автомобиль сохранён"; reload → same
  chat, done state kept; "Интервал LongLife, какое масло подходит?" → DeepSeek used the saved car,
  recommended the oil (VW 507 00), no new save question. One customer `TELEGRAM_200000002`.
  Console: no errors.

Car over several messages, 2026-10-31, same setup, `?tgUser=300000001`, real DeepSeek:
"Skoda Octavia" → asked for year and engine, no question, draft `["Skoda Octavia"]`; "1.5L" → asked
for year and exact engine, draft `["Skoda Octavia", "1.5L"]`; "2016" → asked for the exact
modification; "1.5 TSI 150 л.с." → pointed out that this engine did not exist for a 2016 Octavia
and asked for the engine code (still `need_more_info`, no question); "Ошибся: 1.4 TSI 150 л.с., код
CZDA" → oil recommended and the save question shown; "Сохранить" → saved Skoda Octavia, 2016,
engine "1.4 TSI 150 л.с. CZDA", description with all five car messages; draft cleared.

## Not covered

No automated UI tests exist for `twa/`; the error state of the widget was not triggered.
