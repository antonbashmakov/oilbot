#!/usr/bin/env python3
"""Generate the rule index in AGENTS.md from agent-rules/rules/*.md.

The index sits between the markers `ai-ready-boilerplate:rules:begin` and `…:end` and lists every
rule file present, so a stack without a rule (for example no database migrations) never leaves a
dangling reference.

Usage: gen_rule_index.py [--check]   (--check exits 1 when the index is stale)
"""
import glob
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
AGENTS = os.path.join(ROOT, "AGENTS.md")
BEGIN = re.compile(r"^<!-- ai-ready-boilerplate:rules:begin.*-->$", re.M)
END = re.compile(r"^<!-- ai-ready-boilerplate:rules:end -->$", re.M)
PROJECT_OWNED = {"001", "104", "115"}


def layer(number):
    if number in PROJECT_OWNED or number.startswith("2"):
        return "project"
    return "stack" if number.startswith("1") else "core"


def table():
    rows = ["| File | Layer | Area |", "|---|---|---|"]
    for path in sorted(glob.glob(os.path.join(ROOT, "agent-rules", "rules", "*.md"))):
        name = os.path.basename(path)
        number = name[:3]
        first = open(path, encoding="utf-8").readline().strip()
        m = re.match(r"^#\s+\S+\s+—\s+(.+)$", first)
        title = m.group(1) if m else first.lstrip("# ")
        rows.append("| `agent-rules/rules/%s` | %s | %s |" % (name, layer(number), title))
    return "\n".join(rows)


def render(text):
    b, e = BEGIN.search(text), END.search(text)
    if not b or not e or e.start() < b.end():
        return None
    return text[:b.end()] + "\n" + table() + "\n" + text[e.start():]


def main():
    if not os.path.isfile(AGENTS):
        print("FAIL: AGENTS.md not found")
        return 1
    current = open(AGENTS, encoding="utf-8").read()
    content = render(current)
    if content is None:
        print("FAIL: AGENTS.md has no rule index markers (ai-ready-boilerplate:rules:begin / :end)")
        return 1
    if "--check" in sys.argv[1:]:
        if current != content:
            print("FAIL: the rule index in AGENTS.md is stale — run python3 agent-rules/scripts/gen_rule_index.py")
            return 1
        print("Rule index: up to date")
        return 0
    open(AGENTS, "w", encoding="utf-8").write(content)
    print("written rule index in AGENTS.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
