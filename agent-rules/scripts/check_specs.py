#!/usr/bin/env python3
"""Validate the knowledge base in specifications/.

Exit codes: 0 — no problems; 1 — problems found; 3 — a required tool is missing (step skipped).
"""
import glob
import os
import re
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(__file__))
from specs_lib import COVERAGE, REGISTRY, ROOT, SPECS, ToolMissing, load_yaml, rel, tracker  # noqa: E402

# Source labels of acceptance criteria. The tracker prefix and extra labels come from the registry
# (project.tracker.label, project.extra_labels).
BASE_LABELS = [r"API", r"ADR-\d{3}", r"Q-\d{2,}", r"BUG-\d{3}", r"Review \d{4}-\d{2}-\d{2}", r"Team"]


def label_pattern(reg):
    project = reg.get("project") or {}
    labels = [re.escape(tracker(reg)["label"]) + r"-[0-9A-Za-z_-]+"] + BASE_LABELS
    labels += [re.escape(str(x)) for x in project.get("extra_labels") or []]
    return re.compile(r"^\[(%s)\]" % "|".join(labels))

REF_Q = re.compile(r"\[(Q-\d{2,})\]")
REF_BUG = re.compile(r"\[(BUG-\d{3})\]")
REF_ADR = re.compile(r"\[(ADR-\d{3})\]")
COVERAGE_STATUSES = {"planned", "in_progress", "done", "n/a"}

errors = []


def err(msg):
    errors.append(msg)


def check_registry(reg):
    project = reg.get("project") or {}
    label = label_pattern(reg)
    model = [s.get("code") for s in project.get("status_model") or []]
    if not model:
        err("registry: project.status_model is empty")
    epics = {e.get("id"): e for e in reg.get("epics") or []}
    for eid, e in epics.items():
        spec = e.get("spec")
        if not spec or not os.path.isfile(os.path.join(SPECS, spec)):
            err("registry: epic %s: spec file %r does not exist" % (eid, spec))
    feats = reg.get("features") or []
    ids = [f.get("id") for f in feats]
    for dup in sorted({i for i in ids if ids.count(i) > 1}):
        err("registry: duplicate task id %s" % dup)
    known = set(ids)
    for f in feats:
        fid = f.get("id", "<no id>")
        for field in ("id", "epic", "title", "status", "progress_percent", "acceptance_criteria", "tracker_ids"):
            if field not in f:
                err("registry: %s: missing field %r" % (fid, field))
        if f.get("epic") not in epics:
            err("registry: %s: unknown epic %r" % (fid, f.get("epic")))
        status = f.get("status")
        if status not in model:
            err("registry: %s: status %r is not in the status model" % (fid, status))
        p = f.get("progress_percent")
        if not isinstance(p, int) or not 0 <= p <= 100:
            err("registry: %s: progress_percent must be an integer 0..100" % fid)
        elif status == "done" and p != 100:
            err("registry: %s: status done requires progress_percent 100" % fid)
        if status == "blocked" and not f.get("blocked_reason"):
            err("registry: %s: status blocked requires blocked_reason" % fid)
        for dep in f.get("depends_on") or []:
            if dep not in known:
                err("registry: %s: depends_on unknown task %s" % (fid, dep))
        crit = f.get("acceptance_criteria") or []
        if not crit:
            err("registry: %s: no acceptance criteria" % fid)
        for c in crit:
            if not isinstance(c, str) or not label.match(c):
                err("registry: %s: criterion without a source label: %r" % (fid, str(c)[:80]))
        for tid in f.get("tracker_ids") or []:
            if not os.path.isfile(os.path.join(SPECS, "product", "source-tasks", "%s.md" % tid)):
                err("registry: %s: product/source-tasks/%s.md does not exist" % (fid, tid))
    return known


def check_coverage(cov, known):
    for item in cov.get("coverage") or []:
        fid = item.get("feature")
        if fid not in known:
            err("coverage: unknown task %r" % fid)
        for surface, kinds in item.items():
            if surface == "feature":
                continue
            for kind, status in (kinds or {}).items():
                if status not in COVERAGE_STATUSES:
                    err("coverage: %s %s.%s: status %r not in %s" % (fid, surface, kind, status, sorted(COVERAGE_STATUSES)))


def question_ids():
    path = os.path.join(SPECS, "questions", "OPEN_QUESTIONS.md")
    text = open(path, encoding="utf-8").read()
    open_part, _, decided_part = text.partition("## Decisions")
    open_ids = re.findall(r"^- \*\*(Q-\d{2,})\.", open_part, re.M)
    decided_ids = re.findall(r"^\| (Q-\d{2,}) \|", decided_part, re.M)
    for dup in sorted({i for i in open_ids if open_ids.count(i) > 1}):
        err("questions: duplicate open question %s" % dup)
    for dup in sorted({i for i in decided_ids if decided_ids.count(i) > 1}):
        err("questions: duplicate decision %s" % dup)
    for q in sorted(set(open_ids) & set(decided_ids)):
        line = re.search(r"^- \*\*%s\..*$" % re.escape(q), open_part, re.M).group(0)
        if "(remainder)" not in line:
            err("questions: %s is both open and decided (mark the open part as '(remainder)')" % q)
    return set(open_ids) | set(decided_ids)


def bug_ids():
    text = open(os.path.join(SPECS, "bugs", "BUGS.md"), encoding="utf-8").read()
    ids = re.findall(r"^- \*\*\[(BUG-\d{3})\]\*\*", text, re.M)
    for dup in sorted({i for i in ids if ids.count(i) > 1}):
        err("bugs: duplicate %s" % dup)
    return set(ids)


def adr_ids():
    files = glob.glob(os.path.join(SPECS, "architecture", "adr", "ADR-[0-9][0-9][0-9]-*.md"))
    return {os.path.basename(f)[:7] for f in files}


def check_references(reg, qids, bids, aids):
    for f in reg.get("features") or []:
        for c in f.get("acceptance_criteria") or []:
            for q in REF_Q.findall(c):
                if q not in qids:
                    err("registry: %s references unknown question %s" % (f.get("id"), q))
            for b in REF_BUG.findall(c):
                if b not in bids:
                    err("registry: %s references unknown bug %s" % (f.get("id"), b))
            for a in REF_ADR.findall(c):
                if a not in aids:
                    err("registry: %s references unknown %s" % (f.get("id"), a))


def check_links():
    files = [os.path.join(ROOT, "AGENTS.md")]
    files += glob.glob(os.path.join(ROOT, "agent-rules", "**", "*.md"), recursive=True)
    files += glob.glob(os.path.join(SPECS, "**", "*.md"), recursive=True)
    link = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
    for path in files:
        text = open(path, encoding="utf-8").read()
        text = re.sub(r"```.*?```", "", text, flags=re.S)
        for target in link.findall(text):
            if re.match(r"^[a-z]+:", target) or target.startswith("#"):
                continue
            t = target.split("#", 1)[0]
            if t and not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(path), t))):
                err("links: %s: broken link %s" % (rel(path), target))


def main():
    try:
        reg = load_yaml(REGISTRY)
        cov = load_yaml(COVERAGE)
    except ToolMissing as e:
        print("SKIP: %s" % e)
        return 3
    except ValueError as e:
        print("FAIL: %s" % e)
        return 1
    known = check_registry(reg)
    check_coverage(cov, known)
    qids, bids, aids = question_ids(), bug_ids(), adr_ids()
    check_references(reg, qids, bids, aids)
    check_links()
    if errors:
        print("Specification check: %d problem(s)" % len(errors))
        for e in errors:
            print("  - " + e)
        return 1
    print("Specification check: OK (%d tasks, %d questions, %d bugs, %d ADRs)"
          % (len(known), len(qids), len(bids), len(aids)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
