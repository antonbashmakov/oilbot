---
name: refresh-api-types
description: Refresh a backend API contract this Next.js app consumes and regenerate its TypeScript types — run the project's copy and codegen commands, review the contract diff, fix every usage, update mocks, record the change. Use when the backend contract changed, a task needs a new field or operation, or the type check fails on API types.
---

# Refresh the API contract and generated types

Rules: `108-api-client.md`; the commands and paths are in `104-tech-stack.md` (104.5) and rule 001.8.

## Steps

1. Find the source of the contract (backend repository and path, rule 001.8) and the project's
   refresh and codegen commands (rule 104.5). If the source is another local checkout, check that it
   is on the branch the developer expects; do not change that repository (rule 015.8).
2. Run the refresh command, then the codegen command.
3. Review the contract diff (`git diff <contract path>`): added, removed and changed operations and
   fields; breaking changes (removed fields, new required fields, changed enums) are listed in the
   work log.
4. Never edit the copied contract or the generated file by hand (108.1). If the contract lacks what
   the task needs, stop: the change belongs in the backend repository first (108.3).
5. Run the type check; fix every usage; handle new status codes and enum values in the UI (108.5).
6. Update mocks: MSW handlers, fixtures and stories to the new shapes (108.4), with synthetic data.
7. Run the gate. Record in the work log: contract source and commit or date, the diff summary, the
   fixes. Update `SYSTEM_OVERVIEW.md` ("Backend APIs consumed") when operations were added or
   removed.
