# 105 — Architecture and code style (nextjs)

## Structure

- **105.1** Follow the router the project uses (`app/` or `pages/`, rule 104); do not introduce the
  other one.
- **105.2** Route files (`page.tsx`, `layout.tsx`, route handlers) are thin: they read params, pick
  the data and compose components. Business logic, API access and formatting live in their own
  modules.
- **105.3** Server and client components (App Router): add `"use client"` only to components that
  need state, effects or browser APIs, and keep it as far down the tree as possible.
- **105.4** All calls to backend APIs go through the project's API module (client plus hooks, rule
  108); components never call `fetch` on a backend URL directly.
- **105.5** Server data stays in the data-fetching library's cache (query keys, invalidation); it is
  not copied into global or component state.
- **105.6** Forms use the project's form library and the shared validators; client validation is a
  convenience, the backend still validates.

## Components and styling

- **105.7** Reuse the existing UI components before writing a new one; a new reusable component goes
  to the UI folder with a story covering its states when the project has Storybook (skill
  `add-component`).
- **105.8** Components are styled with Tailwind CSS utility classes in their markup (rule 104 names
  the version and the class helper, such as `clsx`). Use the theme variables or Tailwind theme tokens;
  do not add another styling system or hardcode theme values (colours, fonts, spacing) that exist as
  variables. A project without Tailwind keeps its existing approach until adding Tailwind is agreed
  with the developer as a task of its own; until then 105.16–105.18 do not apply to it. (The styling
  points 105.16–105.18 stand here, out of numeric order, so that 105.9–105.15 keep their numbers.)
- **105.16** No CSS classes for components: a component is styled only with Tailwind utilities in its
  markup. It gets no `*.module.css`, `*.css` or `*.scss` file and no named class in the global
  stylesheet. The global stylesheet holds only the Tailwind import, the theme (variables, theme
  tokens, keyframes), base styles of plain HTML elements and fonts.
- **105.17** Migrate on touch: when a task changes an existing component in any way (markup, text,
  styles, props or logic), the component's CSS Module moves to Tailwind in the same task — its classes
  are replaced with utilities, the module file and its import are removed, and the component looks the
  same at mobile and desktop width (its story when the project has Storybook, and a browser check,
  skill `verify-in-browser`). This includes modules that only set theme variables for descendants (a
  themed or branded area): the variables move to arbitrary properties in the markup
  (`[--color-text:var(--color-text-on-background-dark)]`). Components the task does not change keep
  their CSS Modules until a task changes them.
- **105.18** What looks hard to express with utilities is still written with Tailwind, not with a CSS
  class: keyframes become theme animations (Tailwind 4: `--animate-*` in `@theme` with its
  `@keyframes`; Tailwind 3: `theme.extend.keyframes` and `animation`), third-party or generated markup
  is styled with arbitrary variants on the element that wraps it (`[&_.slick-dot]:bg-(--color-primary)`).
  No `@utility`, `@layer components` or `@layer utilities` classes for components. If no Tailwind form
  exists, ask the developer before adding any other CSS.
- **105.9** Accessibility: semantic elements, a label for every input, `alt` text for meaningful
  images, everything reachable and usable with the keyboard.
- **105.10** Use `next/image`, `next/font` and `next/link` where the project uses them.

## Content, data and configuration

- **105.11** Copy and legal texts change exactly as the task says; legal documents (terms, PDFs)
  come from a named source recorded in the task. Do not rewrite surrounding text.
- **105.12** Money is computed from decimal values or minor units and formatted with the shared
  helpers (`Intl.NumberFormat`); dates are exchanged in UTC and formatted for display only (rules
  005.6, 005.7).
- **105.13** `process.env` is read in the documented places only; `NEXT_PUBLIC_*` values are inlined
  into the browser bundle at build time (rule 110.1).
- **105.14** Redirects, rewrites and headers in `next.config.*` and the middleware are production
  routing and security: changing them needs confirmation (rule 115).
- **105.15** No `console.log` of API responses, form values or tokens in committed code (rule 110.3).
