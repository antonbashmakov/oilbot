# 2026-10-31 — Oil search after choosing a suggested car (CAR-03-BE, CAR-03-FE)

## Plan

- Source: the developer's request in chat with an iPhone screenshot; spec
  `features/CAR-03-oil-search-after-save.md`.
- Phone layout: the input had 14px text, so iOS Safari zoomed into it on focus; no `min-w-0` in its
  flex row. Fix in `Footer.tsx`; return sends.
- Contract: `QuestionAction.follow_up`, `ActionResult.messages` and `follow_up`,
  `searchOilForSavedCar`.
- Backend: the chat answer logic shared by the message and oil search endpoints; confirmation in the
  save_car action.
- UI: `ChatView` appends the action's messages and runs the oil search with the typing indicator.
- Checks: integration tests, types, lint, build, browser at 375 px.

## Done

- `Footer.tsx`: input 16px, `min-w-0`, return sends (`enterKeyHint="send"`), `handleSubmit` depends
  on `onSubmit`.
- Contract: `QuestionAction.follow_up` (`FollowUp`: `oil_search`), `ActionResult.messages` and
  `follow_up`, `searchOilForSavedCar`.
- Backend: `askOilAgent` shared by the message and oil search endpoints; the assistant message is a
  new object whose text is the AI's question or reason (before, success, not_found and unknown
  stored the customer's own text); suggestions carry `follow_up`; the save_car action stores and
  returns the confirmation; `markQuestionAnswered` returns the question and the chat; mock AI reads
  only Latin words as make and model.
- UI: `useOilSearch`, `ChatView.handleActionResult`, `PendingMessage` without content shows only the
  typing indicator; the widget and the carousel report the action result.

## Checks

- `functions`: `tsc` OK, no lint errors on changed lines; tests on emulators 5101/8180: 54/54
  (2 new).
- `twa`: `tsc` OK, no new lint errors. Build not run (the developer's `next dev` was running).
- Browser check recorded in `features-test/CAR-03-FE-TEST.md`.

## Code review

Not done yet: needs a separate session (rule 012).

## Statuses

`CAR-03-BE`, `CAR-03-FE`: planned → in_progress → code_review (90 %).

## Findings and decisions

- The developer's real bot token was found in `functions/.env.test-project`, which is committed; not
  committed, the developer was asked to move it to `functions/.env.local`.
- `GoodsItem` empties the OEM approval badge after the first render (`splice` changes the product);
  not changed here.
- Two calls instead of one long action: the confirmation shows at once, the 10–15 s AI search
  follows with the typing indicator.
