"""Shared helpers for the boilerplate installer and the setup check (standard library only).

`agent-rules/boilerplate.lock`      key=value: source, version, stack
`agent-rules/boilerplate.manifest`  "<sha256>  <path>" per managed file; `AGENTS.md#core` is the
                                    managed block of AGENTS.md
"""
import hashlib
import os
import re

LOCK = os.path.join("agent-rules", "boilerplate.lock")
MANIFEST = os.path.join("agent-rules", "boilerplate.manifest")
CORE_BLOCK = "AGENTS.md#core"
CORE_BEGIN = re.compile(r"^<!-- ai-ready-boilerplate:core:begin.*-->\n", re.M)
CORE_END = re.compile(r"^<!-- ai-ready-boilerplate:core:end -->$", re.M)
# Rule slots every stack must provide; core rules refer to them by number.
REQUIRED_STACK_RULES = ("104", "105", "111", "115")


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    with open(path, "rb") as f:
        return sha256_bytes(f.read())


def core_block(text):
    """Return (start, end) offsets of the managed block content in AGENTS.md, or None."""
    b, e = CORE_BEGIN.search(text), CORE_END.search(text)
    if not b or not e or e.start() < b.end():
        return None
    return b.end(), e.start()


def core_block_text(text):
    span = core_block(text)
    return None if span is None else text[span[0]:span[1]]


def read_lock(root):
    path = os.path.join(root, LOCK)
    data = {}
    if os.path.isfile(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                data[k.strip()] = v.strip()
    return data


def write_lock(root, data):
    lines = ["# Written by ai-ready-boilerplate install.py. Do not edit by hand."]
    lines += ["%s=%s" % (k, data.get(k, "")) for k in ("source", "version", "stack")]
    open(os.path.join(root, LOCK), "w", encoding="utf-8").write("\n".join(lines) + "\n")


def read_manifest(root):
    path = os.path.join(root, MANIFEST)
    entries = {}
    if os.path.isfile(path):
        for line in open(path, encoding="utf-8"):
            line = line.rstrip("\n")
            if line and not line.startswith("#"):
                digest, rel = line.split("  ", 1)
                entries[rel] = digest
    return entries


def write_manifest(root, entries):
    lines = ["# Files managed by ai-ready-boilerplate (sha256). Do not edit them or this file by hand;",
             "# change them in the boilerplate repository and run install.py --update."]
    lines += ["%s  %s" % (entries[k], k) for k in sorted(entries)]
    open(os.path.join(root, MANIFEST), "w", encoding="utf-8").write("\n".join(lines) + "\n")


def current_digest(root, rel):
    """Checksum of a managed path in a project, or None when it is missing."""
    if rel == CORE_BLOCK:
        path = os.path.join(root, "AGENTS.md")
        if not os.path.isfile(path):
            return None
        block = core_block_text(open(path, encoding="utf-8").read())
        return None if block is None else sha256_bytes(block.encode("utf-8"))
    path = os.path.join(root, rel)
    return sha256_file(path) if os.path.isfile(path) else None


def missing_stack_rules(root):
    rules = os.path.join(root, "agent-rules", "rules")
    present = {n[:3] for n in os.listdir(rules)} if os.path.isdir(rules) else set()
    return [n for n in REQUIRED_STACK_RULES if n not in present]
