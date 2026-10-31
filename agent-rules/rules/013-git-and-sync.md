# 013 — Git and repository sync

## Sync before any work

- **013.1** At the start of every request: detect the branch, check the working tree, run
  `git fetch --prune`, find the upstream and compare. If the branch is behind and the tree is clean,
  `git pull --ff-only` and say that the code was updated.
- **013.2** Also list remote branches (`git branch -r`): active work may live on a feature
  branch, not on the main branch.
- **013.3** If the sync cannot complete cleanly (no upstream, dirty tree blocking the update,
  diverged history, conflicts, network or authentication error) — stop all work and ask the developer.
  Never stash, commit, reset, merge or rebase on your own.
- **013.4** Also compare with the branches listed in `001-project-context.md` (001.9); merge new
  commits from them only with the developer's approval.

## Branches and commits

- **013.5** Work on the branch agreed with the developer; for a tracker task that is the task
  branch (013.12). Never switch, create or merge branches silently.
- **013.6** Commit and push only on the developer's explicit word, after showing what will be
  committed and pushed.
- **013.7** Commit subject in conventional style, shorter than 70 characters, with the registry
  task ID and the tracker ID when there is one, for example
  `fix(ORDER-01-BE, TRK-123): register OrderController`.
- **013.8** The commit author comes from the machine's git config. Never pass `--author`,
  `-c user.*` or `GIT_AUTHOR_*`. No AI co-author trailers (`Co-Authored-By`) and no
  "Generated with" lines.
- **013.9** Stage files explicitly; never stage `.env*`, `*.pem`, `*.key`, `*-sa.json`,
  `credentials*`, `.secrets`, `.DS_Store`, IDE folders or local tool output.
- **013.10** Forbidden: `--force` and `--force-with-lease`, `--no-verify`, amending a pushed
  commit, deleting branches, `git reset --hard`.
- **013.11** Stop on any git error, print it verbatim and name the repository and branch.

## One branch per tracker task

- **013.12** When you work on a tracker task, every repository you change for it uses the same
  branch, named after the task: `<tracker label>-<task id>_<task title>_<developer name>`. The
  task title is the title as written in the tracker with every run of characters other than letters
  and digits replaced by one `-` and no `-` at either end; the developer name is the developer's
  full name with spaces replaced by `-`. Example: ClickUp task `869fkhfxq` "Title: Add API
  Pre-check for Partner Customer Eligibility", developer Anton Bashmakov →
  `CU-869fkhfxq_Title-Add-API-Pre-check-for-Partner-Customer-Eligibility_Anton-Bashmakov`.
- **013.13** Before changing a repository for the task, look for the task branch there
  (`git branch -r`). If it exists, continue on it; if not, create it from the up-to-date main
  branch and tell the developer. All work for the task (implementation, review fixes, follow-ups,
  specification updates) goes to that branch in every repository, never to a branch with another
  name.
- **013.14** If the task branch cannot be used (uncommitted work on another branch, the session or
  tool is pinned to a different branch, the title is unclear), stop and ask the developer instead of
  picking another name.
