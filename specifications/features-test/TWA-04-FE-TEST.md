# TWA-04-FE — Test spec

- Task: `TWA-04-FE` — Quick actions under the last message; mileage widget and picker
- Spec: [TWA-04-mileage-widget.md](../features/TWA-04-mileage-widget.md)
- Gate run: see the work log `logs/2026-11-08-mileage-widget.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` three quick actions under the last message, two disabled | browser check below | browser |
| `[Team]` mileage widget with the developer's layout; Выбрать opens the picker | browser check below | browser |
| `[Team]` confirming sends "Пробег: <km> км" and closes the widget | browser check below | browser |

## Browser check

2026-11-08, `next dev` on 3107 against a copy of the backend with the test bot token (emulators
5101/8180, mock AI, seed products), 375 px, `?tgUser=800000001`:

- Under the greeting: "Указать пробег" (active), "Сменить авто" and "Тип топлива" (disabled); the
  row scrolls sideways without a scrollbar, the page does not scroll sideways.
- "Указать пробег" → the widget: "Диагностика ресурса", "Шаг 2 из 2", the hint, "Текущий одометр /
  Не указан", "Выбрать", the time; the quick actions are hidden while it is open.
- "Выбрать" → the sheet "Пробег автомобиля" with 100 000 preselected, slider, presets 50 000–250 000.
  Typing 125000 shows "125 000" and moves the slider; "Готово" sends "Пробег: 125 000 км", the widget
  closes, the mock AI answers, the quick actions return under the new last message.

## Not covered

Inside Telegram; real DeepSeek's use of the mileage.
