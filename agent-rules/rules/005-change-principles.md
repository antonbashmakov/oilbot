# 005 — Change principles

Stack-specific architecture and code style are in `105-architecture.md`; these principles apply in
every stack.

- **005.1** Make the smallest safe change that solves the task; keep existing behaviour unless the
  task requires changing it. Do not silently change public APIs, routes, authentication,
  permissions, schemas, migrations or business rules.
- **005.2** Follow the naming conventions of the language and of the existing code.
- **005.3** Before creating a type, model, component, hook, client or repository, check the existing
  ones and the generated code; reuse or extend them, never duplicate.
- **005.4** Clients of other services and external partners live in dedicated client modules, never
  inside core logic or UI components; generated or SDK types must not leak beyond them.
- **005.5** Errors never expose internal details (stack traces, SQL, exception messages) to users or
  API clients; error responses follow the contract.
- **005.6** Money is a decimal type in code and contracts — never a binary floating point type
  for calculation. Formatting for display happens at the edge.
- **005.7** Timestamps are stored and exchanged in UTC; conversion to local time happens only for
  display.
