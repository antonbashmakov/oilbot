# CAR-01-BE — Test spec

- Task: `CAR-01-BE` — Save-car question from the AI and the customer actions endpoint
- Spec: [CAR-01-saved-car.md](../features/CAR-01-saved-car.md)
- Gate run: see the work log `logs/2026-10-31-saved-car.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` AI answer carries `car_in_message` and `car` | mock: `MockChatbotService`; real DeepSeek: browser check in `CAR-01-FE-TEST.md` (flag returned for "Volkswagen Golf 2015 1.4 TSI" and "Skoda Octavia 2018 1.8 TSI", not for a follow-up without a car) | integration, browser |
| `[Team]` question on the answer when no car is saved | `customer-saved-car.test.ts` "asks to save the car named in the message when the customer has none", "does not ask when the message names no car" | integration |
| `[Team]` `save_car` saves the car, marks the question answered; 400 on bad type or params | "saves the car, marks the question answered and stops asking", "answers 400 for an unknown action type or invalid params", "answers 401 without a token and 403 for another customer", "answers 404 when the customer does not exist" | integration |
| `[Team]` saved car used by the AI and in the greeting | "greets a new chat with the saved car"; real DeepSeek used the saved car without asking for it (browser check) | integration, browser |
| `[Team]` draft over several messages; question only when identified | "builds the car over several messages and asks only once it is identified" (the developer's scenario), "starts over when the customer names another car mid-way"; real DeepSeek in `CAR-01-FE-TEST.md` | integration, browser |
| BUG-005 one customer per person | `customer-chat-auth.test.ts` "creates one customer for parallel sign-ins of the same user" | integration |

## Not covered

- The AI flag is model output: the mock only imitates it; DeepSeek was checked with three messages.
- The other integration suites were not run (they hard-code port 5001).
