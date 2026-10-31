# CAR-03 — Oil search after choosing a suggested car

## Tasks

| Task | Surface | Tracker |
|---|---|---|
| `CAR-03-BE` | backend | — |
| `CAR-03-FE` | frontend | — |

## Context

The developer's request (chat, 2026-10-31): after the customer saves one of the suggested cars
([CAR-02](CAR-02-car-suggestions.md)), the system answers "Автомобиль сохранён, сейчас подыщем
масло" and starts the oil search right away. In the same request: on a real iPhone the chat input
went outside the screen.

## Scope

In scope: `QuestionAction.follow_up`, the confirmation message, the oil search endpoint, the
client flow, the chat input on phones. Out of scope: a follow-up for the CAR-01 save question (the
oil search has already run there).

## Business rules

1. `[Team]` Suggestion questions carry `follow_up: "oil_search"`.
2. `[Team]` `save_car` of a question with `follow_up` stores the assistant message "Автомобиль
   сохранён, сейчас подыщем масло" in the chat and returns it in `ActionResult.messages`, with
   `follow_up`.
3. `[Team]` `POST /private/customers/{customerId}/chats/{chatId}/oil-search` (customer token) asks
   the AI about the saved car (no user message is stored) and returns the assistant messages;
   400 when the customer has no saved car.
4. `[Team]` The app shows the confirmation at once, runs the oil search with the typing indicator,
   then shows the answer.
5. `[Team]` The chat input uses 16px text (iOS Safari zooms into smaller inputs), shrinks in its row
   on narrow screens, and sends on return.

## API calls

| Operation | Status codes handled |
|---|---|
| `performCustomerAction` | 200 with `messages` and `follow_up` |
| `searchOilForSavedCar` `POST …/chats/{chatId}/oil-search` | 200; errors end the typing indicator |

## Tests

[CAR-03-BE-TEST.md](../features-test/CAR-03-BE-TEST.md),
[CAR-03-FE-TEST.md](../features-test/CAR-03-FE-TEST.md).

## Open questions

None.
