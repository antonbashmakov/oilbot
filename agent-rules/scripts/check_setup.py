#!/usr/bin/env python3
"""Check the agent setup installed from ai-ready-boilerplate.

  check_setup.py --stack     exit 1 when no stack is installed (agent-rules/boilerplate.lock)
  check_setup.py --managed   exit 1 when a managed file was edited or removed locally
  check_setup.py --hint      Claude Code SessionStart hook: prints a reminder for the agent, exit 0
"""
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(__file__))
from boilerplate_lib import MANIFEST, current_digest, missing_stack_rules, read_lock, read_manifest  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STACK_MISSING = (
    "No stack is installed: agent-rules/boilerplate.lock has no stack. Do not write code yet. "
    "Suggest a stack from the repository (package.json or ui/package.json with next, or firebase.json "
    "with functions/ -> nextjs), ask the developer to confirm or choose, then install it with the "
    "setup-stack skill (.claude/skills/setup-stack/SKILL.md).")


def stack_problems():
    stack = read_lock(ROOT).get("stack", "")
    if not stack:
        return [STACK_MISSING]
    missing = missing_stack_rules(ROOT)
    if missing:
        return ["Stack %r is recorded but rules %s are missing: re-run the installer (skill setup-stack)."
                % (stack, ", ".join(missing))]
    return []


def managed_problems():
    entries = read_manifest(ROOT)
    if not entries:
        return ["%s is missing or empty: the setup was not installed with install.py." % MANIFEST]
    problems = []
    for rel, digest in sorted(entries.items()):
        now = current_digest(ROOT, rel)
        if now is None:
            problems.append("missing: %s" % rel)
        elif now != digest:
            problems.append("edited locally: %s" % rel)
    return problems


def main():
    args = sys.argv[1:] or ["--stack", "--managed"]
    if "--hint" in args:
        problems = stack_problems()
        if problems:
            print("ai-ready-boilerplate: " + problems[0])
        return 0
    failed = False
    if "--stack" in args:
        problems = stack_problems()
        if problems:
            failed = True
            print("FAIL: " + problems[0])
        else:
            print("Stack: %s (boilerplate %s)" % (read_lock(ROOT).get("stack"), read_lock(ROOT).get("version", "?")))
    if "--managed" in args:
        problems = managed_problems()
        if problems:
            failed = True
            print("FAIL: managed files differ from %s. Do not edit them here; propose the change in the "
                  "boilerplate repository (rule 019.2), or restore them with install.py --update." % MANIFEST)
            for p in problems:
                print("  - " + p)
        else:
            print("Managed files: unchanged (%d)" % len(read_manifest(ROOT)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
