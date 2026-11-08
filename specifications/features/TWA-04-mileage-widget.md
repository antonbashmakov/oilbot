# TWA-04 — Quick actions and mileage widget

## Tasks

| Task | Surface | Tracker |
|---|---|---|
| `TWA-04-FE` | frontend | — |

## Context

The developer's request (chat, 2026-11-08): a mileage selection widget with a given layout,
shown when the user clicks one of the buttons under the last message (the buttons commented out in
TWA-03). Another button changes the car model and one sets the fuel type; both are not implemented
yet. Decision (developer, 2026-11-08): the chosen mileage is sent to the AI as a chat message.

## Scope

In scope: the quick actions row, the mileage widget, the mileage picker sheet, sending the
mileage. Out of scope: changing the car, fuel type (buttons disabled), storing the mileage on the
backend.

## Business rules

1. `[Team]` The quick actions row is shown under the last message of the chat: "Указать пробег",
   "Сменить авто", "Тип топлива". The last two are disabled until implemented.
2. `[Team]` "Указать пробег" shows the mileage widget at the end of the chat (layout from the
   developer: badge "Диагностика ресурса", "Шаг 2 из 2", the hint about TSI/TDI over 100 000 km,
   the current odometer, "Выбрать", the time).
3. `[Team]` "Выбрать" opens a picker sheet: a number field, a slider (0–500 000 km, step 5 000)
   and presets; "Готово" sends the chat message "Пробег: <km> км" (ru number format), shows the
   chosen value and closes the widget.
4. `[Team]` All texts are in `messages/ru.json` (TWA-03).

## Tests

[TWA-04-FE-TEST.md](../features-test/TWA-04-FE-TEST.md).

## Open questions

None.
