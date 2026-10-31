"""Shared helpers for the specification scripts (standard library only)."""
import json
import os
import shutil
import subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SPECS = os.path.join(ROOT, "specifications")
REGISTRY = os.path.join(SPECS, "features", "FEATURE_REGISTRY.yaml")
COVERAGE = os.path.join(SPECS, "features-test", "TEST_COVERAGE.yaml")
JS_YAML = "js-yaml@4.1.0"


class ToolMissing(Exception):
    """A required tool is not available; the calling step must be reported as skipped."""


def load_yaml(path):
    """Parse YAML through `npx js-yaml` (converts YAML to JSON) and return Python objects."""
    if not shutil.which("npx"):
        raise ToolMissing("npx is not installed (needed for %s)" % JS_YAML)
    proc = subprocess.run(["npx", "--yes", JS_YAML, path], capture_output=True, text=True)
    if proc.returncode != 0:
        err = proc.stderr.strip()
        # npx could not fetch or start js-yaml (offline, registry unavailable): a missing tool, not bad YAML.
        if "YAMLException" not in err and ("npm error" in err or "npm ERR!" in err):
            raise ToolMissing("could not run %s through npx: %s" % (JS_YAML, err.splitlines()[0]))
        raise ValueError("%s: invalid YAML\n%s" % (os.path.relpath(path, ROOT), err))
    return json.loads(proc.stdout)


def tracker(reg):
    """Task tracker settings from project.tracker in the registry: name, criterion label prefix, link URL."""
    t = (reg.get("project") or {}).get("tracker") or {}
    return {"name": t.get("name") or "Tracker", "label": t.get("label") or "TRK", "url": t.get("url") or ""}


def rel(path):
    return os.path.relpath(path, ROOT)
