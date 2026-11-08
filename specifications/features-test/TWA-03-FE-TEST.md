# TWA-03-FE — Test spec

- Task: `TWA-03-FE` — Interface texts in Russian through next-intl; filter buttons hidden
- Spec: [TWA-03-russian-texts.md](../features/TWA-03-russian-texts.md)
- Gate run: see the work log `logs/2026-11-08-russian-texts.md`

## Criteria → checks

| Criterion | Test or recorded check | Kind |
|---|---|---|
| `[Team]` every text in `ru.json`, read with next-intl, no English shown | `tsc` with type-checked keys (`src/types/next-intl.d.ts`); `yarn build`: none of the old English texts in `.next/static` or the page HTML; browser check below | types, build, browser |
| `[Team]` dates for `ru`, `<html lang="ru">` | built HTML has `lang="ru"` and the Russian title; browser: "08.11.2026, 11:00" | build, browser |
| `[Team]` filter buttons commented out | `Carousel.tsx`; browser: no buttons under the carousel | browser |

## Browser check

2026-11-08, `next dev` on 3107 against a copy of the backend with the test bot token (emulators
5101/8180, mock AI, the 15 seed products), 375 px:

- `/` → "Войдите через Telegram, чтобы продолжить."; tab title "OilMatch — подбор моторного масла".
- `?tgUser=700000001`, "Volkswagen Golf 2015 1.4 TSI" → header "LubeBot AI · ДИАГ · В сети · подбор
  масла", banner "ТЕЛЕМЕТРИЯ: СПЕЦИФИКАЦИЯ МАСЛА V2.4 / СЕАНС АКТИВЕН", product card "(10 отзывов)",
  "750 ₽", "750,00 / шт", "Купить", no filter buttons, save question "Сохранить", input placeholder
  "Задайте вопрос или укажите год/пробег…", footer "Учтён допуск OEM VW 504 00 · Объём масла 4,5 л";
  both message times "08.11.2026, 11:00".
- "Купить" → checkout sheet all Russian, aria labels "Закрыть", "Меньше", "Больше".
- Console: no errors, no missing-message warnings.

## Not covered

Inside Telegram; the error texts of the save widgets (not triggered).
