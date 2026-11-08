# 2026-11-08 — Quick actions and mileage widget (TWA-04-FE)

## Plan

- Source: the developer's request in chat with the widget layout; spec
  `features/TWA-04-mileage-widget.md`. The developer chose to send the mileage to the AI as a chat
  message.
- `QuickActions` under the last message (replaces the commented filter buttons in `Carousel.tsx`),
  `MileageWidget` (the given markup, texts in `ru.json`), `MileagePickerSheet` (bottom sheet like
  the checkout sheet), `ChatView` wiring through the existing send.
- Checks: `tsc`, lint, build, browser at 375 px with the mock AI.

## Done

- `QuickActions.tsx` (row under the last message; "Сменить авто" and "Тип топлива" disabled),
  `MileageWidget.tsx` (the given markup; texts in `ru.json` "Mileage"), `MileagePickerSheet.tsx`
  (number field formatted with the ru formatter, slider 0–500 000 step 5 000, presets, Готово),
  `ChatView.tsx` (widget at the end, quick actions hidden while an answer is pending or the widget is
  open, the mileage sent with the existing send). The commented filter buttons removed from
  `Carousel.tsx`, their texts removed from `ru.json`.
- `globals.css`: the `no-scrollbar` utility, used by four components but never defined, so the
  carousels and the checkout sheet showed scrollbars.

## Checks

- `tsc` OK; new files lint clean (ChatView keeps its two existing errors); `yarn build` OK.
- Browser check recorded in `features-test/TWA-04-FE-TEST.md`.

## Deploy

2026-11-08, on the developer's word: committed as `e4b1550`, deployed `hosting:twa` to
`oilmatch-prod`. Live: page 200; the client code has the quick action, widget and picker texts; the
CSS has the `no-scrollbar` rule.

## Code review

Not done yet: needs a separate session (rule 012).

## Statuses

`TWA-04-FE`: planned → in_progress → code_review (90 %).

## Findings and decisions

- "Шаг 2 из 2" is kept from the given layout; there is no step 1 in the chat.
- The odometer starts as "Не указан"; the picker starts at 100 000 km.
