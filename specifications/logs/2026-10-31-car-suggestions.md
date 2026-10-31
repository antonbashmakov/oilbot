# 2026-10-31 — Car model suggestions (CAR-02-BE, CAR-02-FE)

## Plan

- Source: the developer's request in chat; spec `features/CAR-02-car-suggestions.md`.
- Contract: `ChatMessage.questions` (array) replaces `question`; `OilAgentResponse.suggested_cars`.
- Prompt: `suggested_cars` with `need_more_info`, up to 3, consistent with what was said.
- Backend: suggestions message after the answer; `save_car` clears the draft;
  `markQuestionAnswered` marks the question with the same params; mock AI suggests two cars.
- UI: `QuestionActionCarousel` for several questions, the widget for one.
- Checks: integration tests, types, lint, build, browser walk with DeepSeek.

## Done

- Contract: `ChatMessage.questions`, `OilAgentResponse.suggested_cars` (max 3); copied to `twa/`.
- Prompt: section 2a "Предложи вероятные модели", example with `suggested_cars`.
- Backend: the CAR-01 save question as `questions: [..]`; suggestions message
  (`prompts/carSuggestionsIntro.ts`) when status is `need_more_info`, there are suggestions and no
  saved car; `saveCar` clears the draft; `markQuestionAnswered` matches params independent of key
  order; mock AI suggests two cars.
- UI: `QuestionActionCarousel` (cards with save, sending, saved, disabled, error), `ChatView` picks
  the widget or the carousel by the number of questions.

## Checks

- `functions`: `tsc` OK, no lint errors on changed lines; tests on emulators 5101/8180: 48/48
  (12 saved-car incl. 3 suggestion cases, 10 auth, 26 unit).
- `twa`: `tsc` OK, new files lint clean. `yarn build` not run: the developer's `next dev` was running
  in `twa/` and Next.js 16 allows one per folder; the browser check used that server instead
  (recorded in `features-test/CAR-02-FE-TEST.md`).

## Code review

Not done yet: needs a separate session (rule 012).

## Statuses

`CAR-02-BE`, `CAR-02-FE`: planned → in_progress → code_review (90 %).

## Findings and decisions

- Suggestions are separate save_car questions on a second assistant message, so the text
  "Возможно вам подходит какая-то из этих моделей?" stays in the chat history.
- `params` holds a `Car` object (make, model, year, engine, description), not a plain string, so
  the saved car keeps its fields.
