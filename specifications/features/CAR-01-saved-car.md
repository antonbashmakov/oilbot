# CAR-01 — Saved car in the AI chat

## Tasks

| Task | Surface | Tracker |
|---|---|---|
| `CAR-01-BE` | backend | — |
| `CAR-01-FE` | frontend | — |

## Context

The developer's request (chat, 2026-10-31): when a customer types a car model, the system asks
whether to save it as the customer's car; once saved, the AI does not ask for the car again. PRD
section 3 (AI oil-selection chat).

## Scope

In scope: the AI flag `car_in_message`, the question on the assistant message, the generic
customer actions endpoint with the action `save_car`, the saved car on the customer, the saved car
in the AI input and the first greeting, `QuestionActionWidget` in `twa/`. Out of scope: editing or
deleting the saved car, several cars per customer, declining the question (the widget has one
button).

## Business rules

1. `[Team]` The AI answer always carries `car_in_message`: true when the user's last message gives
   information about the car being identified (make, model, engine, year, modification — also a
   bare answer like "1.5L" or "2016" to a question about the car). It also carries `car` with the
   car combined from the earlier car messages and this one (`make`, `model`, `year` and `engine` or
   null), and `new_car`: true when the message starts describing a different car than the earlier
   car messages.
2. `[Team]` Car messages are kept in a temporary draft on the customer (`car_draft.tokens`,
   valid 24 hours) and sent to the AI as `car_tokens`. While the answer is `need_more_info` and
   `car_in_message` is true, the message is added to the draft (with `new_car` the draft restarts
   with this message). Any other status ends the identification and clears the draft.
2a. `[Team]` The save question is added only when the status is not `need_more_info`,
   `car_in_message` is true, `car` has make and model, and the customer has no saved car:
   `{text: "Хотите сохранить автомобиль в системе?", type: "save_car", params: [car]}`;
   `car.description` is the draft tokens and this message joined with ", " (for example
   "Skoda Octavia, 1.5L, 2016").
3. `[Team]` `POST /private/customers/{customerId}/actions` (customer token, rule TWA-01 3) runs the
   action named by `type` with `params`. `save_car` saves `params[0]` (make and model required) as
   the customer's `car`. With `message_id` the question of that message (owned by the customer) is
   marked `answered`. Unknown `type` or invalid `params` → 400; no customer → 404.
4. `[Team]` With a saved car the AI input carries `saved_car`; the AI uses it when the message names
   no other car and asks only for missing details. A chat started with a saved car greets with it.

## UI states

`QuestionActionWidget`: question with the button "Сохранить"; sending (button disabled); done
("Автомобиль сохранён", also for questions answered earlier, so the chat keeps the confirmation);
error (message, button active again).

## API calls

| Operation | Status codes handled |
|---|---|
| `performCustomerAction` `POST /private/customers/{customerId}/actions` | 200; 4xx/5xx → error state |
| `GET …/chats/{chatId}/messages` | refetched after an action |

## Scenario

1. "Skoda Octavia" → the AI asks for the engine; draft `["Skoda Octavia"]`; no question.
2. "1.5L" → the AI asks for the year; draft `["Skoda Octavia", "1.5L"]`; no question.
3. "2016" → the AI recommends (or reports no oil); the question offers Skoda Octavia, 2016, 1.5L
   with the description "Skoda Octavia, 1.5L, 2016"; the draft is cleared. "Сохранить" saves it as
   the customer's car.

## Customer identity

Sign-in creates a customer only once per person: a new customer's id is `<ORIGIN>_<external_id>`,
written with `create()`, so parallel sign-ins (two requests, React Strict Mode in dev) cannot make
two customers (BUG-005). Existing customers keep their ids and are still found by `external_id`.

## Personal data

The saved car (make, model, year, engine, the customer's own description) is stored on the
customer — [PERSONAL_DATA.md](../security/PERSONAL_DATA.md).

## Tests

[CAR-01-BE-TEST.md](../features-test/CAR-01-BE-TEST.md),
[CAR-01-FE-TEST.md](../features-test/CAR-01-FE-TEST.md).

## Known issues

BUG-005 (fixed with this epic) — [BUGS.md](../bugs/BUGS.md).

## Open questions

None.
