---
name: setup-stack
description: Install, add or update the ai-ready-boilerplate agent setup in this repository — detect the stack, ask the developer to confirm or choose it, run the boilerplate installer, fill in the project-owned files, run the gate. Use when agent-rules/boilerplate.lock is missing or has no stack, when the SessionStart hook or the gate says "No stack is installed", or when asked to install, adopt or update the boilerplate or the agent rules.
---

# Set up or update the agent setup

Rules: `019-rule-layers-and-updates.md`, `015.8`, `015.9`.

## 1. Get the boilerplate

Use a local checkout when the developer names one (or `$AI_BOILERPLATE_DIR` is set). Otherwise clone
the `source` from `agent-rules/boilerplate.lock` (default
`git@github.com:antonbashmakov/aimakler.git`) into a temporary directory:

    git clone --depth 1 <source> "$TMPDIR/ai-ready-boilerplate"

Never clone into this repository and never commit the boilerplate into it.

## 2. Choose the stack — always ask

1. Read `agent-rules/boilerplate.lock`. If `stack=` is set and the developer did not ask to update,
   report it and stop. A different stack for a repository that has one is not supported (019.6).
2. List the stacks: `python3 <boilerplate>/install.py --list-stacks`.
3. Detect a candidate from the repository: `package.json` (or `ui/package.json`) with a `next`
   dependency, or `firebase.json` with `functions/` → `nextjs`. Several matches or none: no
   candidate.
4. **Ask the developer** which stack to install, with the candidate first and the evidence for it
   (the file and line you found). Wait for the answer; never install a stack on your own guess. If no
   stack fits, say so: a new stack belongs in the boilerplate repository (`stacks/<name>/`).

## 3. Install

1. The working tree should be clean or the developer should agree to mix the changes; the setup is a
   task of its own (for example `SETUP-01-DOC`) on a branch agreed with the developer (rule 013).
2. Dry run first and show the plan:
   `python3 <boilerplate>/install.py --stack <stack> --dry-run .`
3. Install: `python3 <boilerplate>/install.py --stack <stack> .`
4. A CONFLICT line means a managed file exists here with other content. Show it to the developer;
   `--force` (which overwrites it) only on the developer's explicit word (015.9).

## 4. Update (when asked)

`python3 <boilerplate>/install.py --update --dry-run .`, show the plan, then run it without
`--dry-run`. Show the developer the diff (`git diff`) of the updated rules and scripts.

## 5. Fill in the project-owned files

Resolve every `<placeholder>` and `ADOPT` comment, from the repository itself (build files, CI
files, code) and with the developer's answers for anything the code cannot tell:

    grep -rn '<[a-z][^>]*>\|ADOPT' AGENTS.md agent-rules/project.sh agent-rules/rules/001-* agent-rules/rules/104-* agent-rules/rules/115-* specifications --include='*.md' --include='*.sh' --include='*.yaml'

- `AGENTS.md` project sections (Project, Status, Repository layout);
- `agent-rules/project.sh` (paths, contracts, build steps, precheck) and rules 001, 104, 115;
- `specifications/`: the `project` section of the registry, `PRD.md`, `SYSTEM_OVERVIEW.md`,
  `PERSONAL_DATA.md`, `features-test/README.md`.

Facts you could not verify are marked "not verified"; product intent you cannot read from the code
becomes a question `Q-NN` (rule 002.4). Project-specific rules go to new `2NN-<topic>.md` files.

## 6. Regenerate and check

    python3 agent-rules/scripts/gen_rule_index.py
    python3 agent-rules/scripts/gen_cursorrules.py
    python3 agent-rules/scripts/gen_spec_index.py
    python3 agent-rules/scripts/gen_project_review.py
    agent-rules/scripts/gate.sh

Report every gate step; a skipped step is not a passed step (011.3).
