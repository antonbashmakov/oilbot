# CAR-03-FE — Test spec

- Task: `CAR-03-FE` — Show the confirmation and run the oil search; chat input on phones
- Spec: [CAR-03-oil-search-after-save.md](../features/CAR-03-oil-search-after-save.md)
- Gate run: see the work log `logs/2026-10-31-oil-search-after-save.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` confirmation, typing indicator, answer | browser check below | browser |
| `[Team]` input does not zoom, stays inside the screen, return sends | browser check below (16px, widths); iPhone itself not checked | browser |

## Browser check

2026-10-31, a copy of `twa/` in the scratchpad (`next dev` on 3107) against a copy of the backend
with the committed test token (emulators 5101/8180, mock AI), because the developer's own servers
were running with a real bot token; `?tgUser=600000001`:

- Input: font-size 16px, `enterkeyhint="send"`; the input row spans 16–359 px at 375 px and 16–304 px
  at 320 px; page `scrollWidth` equals the viewport.
- "Skoda Octavia" sent with return → "Укажите двигатель", the suggestions message and two cards.
- "Сохранить" on the first → card "Автомобиль сохранён", the other disabled; "Автомобиль сохранён,
  сейчас подыщем масло"; `POST …/oil-search` 200; the oil card. Console: no errors. The mock AI
  answers at once, so the typing indicator only flashed.

## Not covered

A real iPhone (Safari's zoom cannot be emulated); `yarn build` (the developer's `next dev` was
running in `twa/`); the typing indicator during a real DeepSeek wait.
