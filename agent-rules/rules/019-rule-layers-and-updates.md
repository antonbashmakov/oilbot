# 019 — Rule layers, project overrides and boilerplate updates

## Layers

- **019.1** The agent setup of this repository comes from `ai-ready-boilerplate` in three layers:
  core rules `0xx` (every project), stack rules `1xx` (the stack named in
  `agent-rules/boilerplate.lock`) and project rules (`001`, `104`, `115` and `2xx`).
- **019.2** Managed files — core and stack rules, scripts, hooks, shared skills, spec templates —
  are listed with their checksums in `agent-rules/boilerplate.manifest`. Never edit them here:
  the gate step "agent / managed files" fails on a local edit. A change that is useful beyond this
  project goes to the boilerplate repository.
- **019.3** Project-owned files are never overwritten by an update: `AGENTS.md` outside its managed
  block, `CLAUDE.md`, `agent-rules/project.sh`, rules `001`, `104`, `115` and `2xx`, project skills
  (any `.claude/skills/` folder not in the manifest) and everything in `specifications/` except the
  `_TEMPLATE*.md` files.

## Project rules and overrides

- **019.4** A project rule lives in `agent-rules/rules/2NN-<topic>.md`. It overrides a core or
  stack rule only when it names the rule it overrides, for example "**201.1** Overrides 111.4: …";
  everywhere else the stricter rule applies.
- **019.5** After adding or renaming a rule, regenerate the rule index in `AGENTS.md` and
  `.cursorrules`: `python3 agent-rules/scripts/gen_rule_index.py` and
  `python3 agent-rules/scripts/gen_cursorrules.py`.

## Stack

- **019.6** If `agent-rules/boilerplate.lock` has no stack, do not write code: suggest a stack
  from the repository, ask the developer to choose, and install it (skill `setup-stack`). Never
  choose a stack without the developer's answer, and never switch the stack of a repository that
  already has one without the developer's explicit word.

## Updates

- **019.7** The boilerplate is updated only with its installer:
  `python3 <boilerplate>/install.py --update .` (skill `setup-stack`, "Update"). The installer
  overwrites managed files that are unchanged, refuses to overwrite a locally edited one and lists
  it, adds new files and removes managed files the boilerplate no longer has. Show the developer the
  resulting diff; it is committed like any other change.
