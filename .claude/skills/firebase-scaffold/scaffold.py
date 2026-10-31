#!/usr/bin/env python3
"""Write the Firebase project skeleton (rules 106, 107) from templates/ into a repository.

  python3 .claude/skills/firebase-scaffold/scaffold.py --slug my-app [--region europe-west1] [--dry-run] TARGET

Every templates/<path>.tmpl becomes TARGET/<path> with __SLUG__ and __REGION__ replaced. Files that
already exist are never overwritten: they are listed as "exists" so the agent can merge by hand.
Exit codes: 0 done; 1 an error.
"""
import argparse
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = os.path.join(HERE, "templates")
# Templates are stored without a leading dot so they do not act as live configuration here.
RENAMES = {
    "firebaserc": ".firebaserc",
    "gitignore": ".gitignore",
    "functions/gitignore": "functions/.gitignore",
    "functions/env.demo": "functions/.env.demo-__SLUG__",
    "ui/env.development": "ui/.env.development",
    "ui/env.production": "ui/.env.production",
}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("target")
    ap.add_argument("--slug", required=True, help="project slug; the emulator project is demo-<slug>")
    ap.add_argument("--region", default="europe-west1")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if not re.fullmatch(r"[a-z][a-z0-9-]{1,24}[a-z0-9]", a.slug):
        print("error: --slug must be 3-26 characters of a-z, 0-9 and '-' (it becomes the project id demo-<slug>)")
        return 1
    target = os.path.abspath(a.target)
    if not os.path.isdir(target):
        print("error: %s is not a directory" % target)
        return 1

    def fill(text):
        return text.replace("__SLUG__", a.slug).replace("__REGION__", a.region)

    written, existing = [], []
    for dirpath, _, filenames in os.walk(TEMPLATES):
        for name in sorted(filenames):
            if not name.endswith(".tmpl"):
                continue
            src = os.path.join(dirpath, name)
            rel = os.path.relpath(src, TEMPLATES).replace(os.sep, "/")[:-len(".tmpl")]
            rel = fill(RENAMES.get(rel, rel))
            dst = os.path.join(target, rel)
            if os.path.exists(dst):
                existing.append(rel)
                continue
            written.append(rel)
            if a.dry_run:
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(src, encoding="utf-8") as f:
                content = fill(f.read())
            with open(dst, "w", encoding="utf-8") as f:
                f.write(content)

    for rel in sorted(written):
        print("  %-7s %s" % ("plan" if a.dry_run else "write", rel))
    for rel in sorted(existing):
        print("  exists  %s (not overwritten: merge by hand)" % rel)
    if a.dry_run:
        print("dry run: nothing written")
    return 0


if __name__ == "__main__":
    sys.exit(main())
