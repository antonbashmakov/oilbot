# CAR-02 — Car model suggestions

## Tasks

| Task | Surface | Tracker |
|---|---|---|
| `CAR-02-BE` | backend | — |
| `CAR-02-FE` | frontend | — |

## Context

The developer's request (chat, 2026-10-31): when the customer's car data is insufficient, the AI
proposes up to three most probable models, which the customer can pick and save. Builds on
[CAR-01](CAR-01-saved-car.md).

## Scope

In scope: `suggested_cars` in the AI answer, `ChatMessage.questions` (array, replaces `question`),
the suggestions message, choosing a suggestion, the questions carousel in `twa/`. Out of scope:
suggestions for customers who already have a saved car (choosing would replace it), old messages
with the single `question` field (none in production).

## Business rules

1. `[Team]` With status `need_more_info` and car data so far (`car_tokens` and the message), the AI
   also returns `suggested_cars`: up to 3 existing complete variants (`make`, `model`, `year`,
   `engine`), most probable first, consistent with everything the customer said; otherwise an
   empty array.
2. `[Team]` When there are suggestions and the customer has no saved car, the AI answer is followed
   by a second assistant message with the text "Возможно вам подходит какая-то из этих моделей?"
   and `questions`: one `{text: <car>, type: "save_car", params: [car]}` per suggestion, where
   `car.description` is the car's make, model, year and engine.
3. `[Team]` The save question of CAR-01 is `questions: [question]` on the answer.
4. `[Team]` `save_car` from any question saves the car and clears the car draft; with `message_id`
   only the question with the same `params` is marked `answered`.

## UI states

One question: the CAR-01 widget. Several questions: the message text, then a horizontal carousel
of cards (car, "Сохранить"); sending (card button disabled); chosen card "Автомобиль сохранён",
other cards disabled; error under the card.

## API calls

`performCustomerAction` as in CAR-01 (body `type`, `params`, `message_id`).

## Personal data

Suggestions are derived from the customer's car messages; a chosen one is stored as in CAR-01.

## Tests

[CAR-02-BE-TEST.md](../features-test/CAR-02-BE-TEST.md),
[CAR-02-FE-TEST.md](../features-test/CAR-02-FE-TEST.md).

## Open questions

None.
