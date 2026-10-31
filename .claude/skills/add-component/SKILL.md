---
name: add-component
description: Add or change a React component in this Next.js app the project's way — reuse check, placement, server or client component, styling with the theme, a Storybook story with mocks for every state, accessibility, then specs. Use when a task adds a UI component, section, form field or page block, or changes one noticeably.
---

# Add or change a component

Rules: `105-architecture.md`, `108-api-client.md`, `110-browser-security.md`, `111-testing.md`.

## Steps

1. **Reuse first.** Search the UI folders and existing stories for a component that does the job or
   can be extended (rule 005.3). Prefer extending with a prop over copying.
2. **Place it.** Feature-specific components next to their feature; reusable ones in the UI folder
   (rule 001.7). Name the file and the component the way neighbouring files are named.
3. **Server or client.** Keep it a server component unless it needs state, effects or browser APIs
   (105.3). Data from the backend comes through the API hooks (105.4), typed with the generated
   types (108.2).
4. **Style it** with Tailwind utility classes and the theme variables only (105.8); no CSS file and
   no named CSS class for the component (105.16, 105.18). When you change an existing component that
   has a CSS Module in any way, move it to Tailwind in the same task and delete the module (105.17).
   Check mobile and desktop.
5. **Accessibility:** semantic elements, labels, `alt`, keyboard use (105.9).
6. **Story** (when the project has Storybook): one story per state — loading, error, empty,
   success, and partner or theme variants when the component is branded; mock API calls with the
   project's MSW handlers and synthetic fixtures (108.7).
7. **Tests** when the project has a unit test framework: behaviour, not markup.
8. **Use it** in the page; run the type check and lint; check it in the browser (skill
   `verify-in-browser`).
9. **Specifications:** spec ("UI states"), test document (story names as checks),
   `TEST_COVERAGE.yaml` (`story`, `browser`), log.
