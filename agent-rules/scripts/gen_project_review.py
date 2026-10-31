#!/usr/bin/env python3
"""Generate specifications/PROJECT_REVIEW.html: the state of the project for its team and stakeholders.

Sources: features/FEATURE_REGISTRY.yaml, product/source-tasks/README.md, questions/OPEN_QUESTIONS.md.
The page is static and self-contained and has no generation time, so the output depends only on
these files. Project name, client, task tracker and translation mode come from the `project` section
of the registry.

The interface is in English and Russian. Russian texts of the data come from
specifications/i18n/PROJECT_REVIEW.ru.yaml; with project.review_translation "required" every data text
needs one, otherwise a missing translation falls back to English.

Usage: gen_project_review.py [--check | --missing]
--check exits 1 when the committed page is stale, a required Russian translation is missing or unused, or an
entry of the source tasks or the questions journal does not follow its format;
--missing prints the missing translations as YAML entries. Exit 3 means a required tool is missing.
"""
import glob
import html
import json
import os
import re
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(__file__))
from specs_lib import REGISTRY, SPECS, ToolMissing, load_yaml, rel, tracker  # noqa: E402

OUT = os.path.join(SPECS, "PROJECT_REVIEW.html")
SOURCE_TASKS = os.path.join(SPECS, "product", "source-tasks", "README.md")
QUESTIONS = os.path.join(SPECS, "questions", "OPEN_QUESTIONS.md")
THEME_KEY = "project-review-theme"  # replaced by "<project name>-review-theme" in build()


# ---------- reading the sources ----------

# A source line that looks like an entry but does not follow the format fails the build (ValueError → --check
# exit 1) instead of silently disappearing from the page.

def read_source_tasks():
    """Tracker tasks of the technical assignment: [(id, title, created)] in file order."""
    rows, bad = [], []
    for n, line in enumerate(open(SOURCE_TASKS, encoding="utf-8"), 1):
        line = line.rstrip()
        if not line.startswith("|") or re.match(r"^\| [^|]*ID \|", line) or re.match(r"^\|[-| ]+\|$", line):
            continue
        m = re.match(r"^\| \[([0-9A-Za-z_-]+)\]\(\1\.md\) \| ([^|]+?) \| (\d{4}-\d{2}-\d{2}) \| [^|]*\|$", line)
        if m:
            rows.append(m.groups())
        else:
            bad.append("%s:%d: table row is not '| [id](id.md) | title | YYYY-MM-DD | tasks |'" % (rel(SOURCE_TASKS), n))
    if bad:
        raise ValueError("\n".join(bad))
    return rows


ENTRY = re.compile(r"^- \*\*(Q-\d{2,})\. (.+?)\*\* \((.+?)\)\. (.+?) Until answered — (.+?) Blocks: (.+?)\.?$")


def read_questions():
    """Open questions grouped by section, and the decisions table."""
    text = open(QUESTIONS, encoding="utf-8").read()
    parts = re.split(r"^## Decisions[ \t]*$", text, maxsplit=1, flags=re.M)
    if len(parts) != 2:
        raise ValueError("%s: no '## Decisions' section" % rel(QUESTIONS))
    open_part, decided_part = parts
    groups, bad = [], []
    sections = re.split(r"^### ", open_part, flags=re.M)
    if re.search(r"^[-*+] ", sections[0], re.M):
        bad.append("%s: an open question outside a '### ' section" % rel(QUESTIONS))
    for sec in sections[1:]:
        heading, _, body = sec.partition("\n")
        items = []
        # An entry starts with "- " at the line start; its continuation lines are indented.
        for entry in re.split(r"^(?=[-*+] )", body, flags=re.M):
            if not re.match(r"[-*+] ", entry):
                continue
            flat = " ".join(entry.split())
            m = ENTRY.match(flat)
            if not m:
                bad.append("%s: open question does not follow '- **Q-NN. Title** (source). Question. "
                           "Until answered — behaviour. Blocks: tasks.': %s" % (rel(QUESTIONS), flat[:80]))
                continue
            qid, title, source, question, until, blocks = m.groups()
            items.append({"id": qid, "title": title, "source": source, "question": question,
                          "until": until, "blocks": blocks})
        groups.append((heading.strip(), items))
    decisions = []
    for line in decided_part.splitlines():
        line = line.rstrip()
        if not line.startswith("|") or line.startswith("| ID |") or re.match(r"^\|[-| ]+\|$", line):
            continue
        m = re.match(r"^\| (Q-\d{2,}) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \|$", line)
        if not m:
            bad.append("%s: decision row does not follow '| Q-NN | question | decision | where applied |': %s"
                       % (rel(QUESTIONS), line[:80]))
            continue
        qid, question, decision, applied = m.groups()
        kind = "withdrawn" if decision.startswith("Withdrawn") else "decided"
        decisions.append({"id": qid, "question": question, "decision": decision,
                          "applied": applied, "kind": kind})
    if bad:
        raise ValueError("\n".join(bad))
    return groups, decisions


# ---------- helpers ----------

def esc(text):
    return html.escape(str(text), quote=True)


def js(text):
    """A JavaScript string literal safe inside <script>."""
    return json.dumps(str(text), ensure_ascii=False).replace("<", "\\u003c")


def md(text):
    """Inline Markdown subset used in the specifications: code, bold, links (text only)."""
    t = esc(text)
    t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    return t


def mean(values):
    return int(sum(values) / len(values) + 0.5) if values else None


def plural(n, one, many):
    return "%d %s" % (n, one if n == 1 else many)


ADR_FILES = {os.path.basename(p)[:7]: os.path.relpath(p, SPECS)
             for p in glob.glob(os.path.join(SPECS, "architecture", "adr", "ADR-[0-9][0-9][0-9]-*.md"))}


TRACKER = {"name": "Tracker", "label": "TRK", "url": ""}  # set from the registry in build()
CLIENT = "the client"


def label_link(label):
    """Where a criterion source label points to, relative to specifications/."""
    prefix = TRACKER["label"] + "-"
    if label.startswith(prefix):
        return "product/source-tasks/%s.md" % label[len(prefix):]
    if label.startswith("Q-"):
        return "#%s" % label
    if label.startswith("BUG-"):
        return "bugs/BUGS.md"
    if label.startswith("ADR-"):
        return ADR_FILES.get(label)
    return None


# ---------- languages ----------
# Every translatable text is rendered in English and Russian; CSS shows one of them by html[data-lang]
# Interface strings live here; Russian texts of the data come from TRANSLATIONS, keyed by the exact
# English text, so a changed source text has no translation (--check fails when translations are required).

TRANSLATIONS = os.path.join(SPECS, "i18n", "PROJECT_REVIEW.ru.yaml")
LANG_KEY = "project-review-lang"  # replaced by "<project name>-review-lang" in build()


class Russian:
    """Lookup of Russian data texts; records missing and used entries for --check and --missing."""

    def __init__(self, table):
        self.table = table
        self.used = set()
        self.missing = []

    def get(self, en):
        if not en:
            return en
        ru = self.table.get(en)
        if ru:
            self.used.add(en)
            return ru
        if en not in self.missing:
            self.missing.append(en)
        return en

    def unused(self):
        return [k for k in self.table if k not in self.used]


RU = Russian({})
TRANSLATION_REQUIRED = False


def both(en_html, ru_html):
    """Already escaped HTML in both languages."""
    if en_html == ru_html:
        return en_html
    return '<span data-l="en">%s</span><span data-l="ru">%s</span>' % (en_html, ru_html)


def tx(en):
    """A data text (inline Markdown) in both languages."""
    return both(md(en), md(RU.get(en)))


def tr(en):
    """A data text as plain Russian, for search, attributes and option texts."""
    return RU.get(en)


def attr(name, en, ru):
    """An attribute that the language switch rewrites."""
    return '%s="%s" data-en-%s="%s" data-ru-%s="%s"' % (name, esc(en), name, esc(en), name, esc(ru))


def ru_word(n, one, few, many):
    """Russian word form after a number: 1 задача, 2 задачи, 5 задач (the word only)."""
    if n % 10 == 1 and n % 100 != 11:
        return one
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return few
    return many


def ru_count(n, one, few, many):
    """Russian noun after a number: 1 задача, 2 задачи, 5 задач."""
    return "%d %s" % (n, ru_word(n, one, few, many))


def ru_one(n, singular, plural_form):
    """Russian noun after a number in oblique cases: 1 → singular, otherwise plural (4 задач, 21 задачи)."""
    return "%d %s" % (n, ru_word(n, singular, plural_form, plural_form))


UI = {
    "subtitle": ("Project review", "Ревью проекта"),
    "intro": ("The state of the project from <code>specifications/</code>: the task registry, the technical assignment "
              "({tracker} tasks) and the questions journal.",
              "Состояние проекта по <code>specifications/</code>: реестр задач, техническое задание (задачи {tracker}) "
              "и журнал вопросов."),
    "sections": ("Sections", "Разделы"),
    "assignment": ("Technical assignment", "Техническое задание"),
    "tasks": ("Tasks", "Задачи"),
    "open_questions": ("Open questions", "Открытые вопросы"),
    "decisions": ("Decisions", "Решения"),
    "theme": ("Theme", "Тема"),
    "light": ("Light", "Светлая"),
    "dark": ("Dark", "Тёмная"),
    "system": ("System", "Системная"),
    "language": ("Language", "Язык"),
    "by_ta": ("Readiness by the technical assignment", "Готовность по техническому заданию"),
    "by_spec": ("Readiness by specifications", "Готовность по спецификациям"),
    "by_status": ("Tasks by status", "Задачи по статусам"),
    "q_card": ("Questions to {client}", "Вопросы к {client}"),
    "q_open": ("Open", "Открытые"),
    "q_decided": ("Decided", "Решённые"),
    "q_withdrawn": ("Withdrawn", "Снятые"),
    "ta_note": ("{tracker} tasks from <code>product/source-tasks/</code>; readiness is the mean progress of the "
                "registry tasks linked to each of them.",
                "Задачи {tracker} из <code>product/source-tasks/</code>; готовность — средняя готовность связанных "
                "с ними задач реестра."),
    "ta_none": ("No technical assignment in <code>product/source-tasks/</code>.",
                "В <code>product/source-tasks/</code> нет технического задания."),
    "no_linked": ("No registry task", "Нет задач в реестре"),
    "created": ("Created", "Создана"),
    "tasks_note": ("Statuses and percentages come from <code>features/FEATURE_REGISTRY.yaml</code>. Open a task "
                   "for its acceptance criteria and links.",
                   "Статусы и проценты берутся из <code>features/FEATURE_REGISTRY.yaml</code>. Откройте задачу, "
                   "чтобы увидеть критерии приёмки и ссылки."),
    "search": ("Search by ID, title, criterion or label", "Поиск по номеру, названию, критерию или метке"),
    "search_label": ("Search tasks", "Поиск задач"),
    "epic": ("Epic", "Эпик"),
    "all_epics": ("All epics", "Все эпики"),
    "status": ("Status", "Статус"),
    "all": ("All", "Все"),
    "expand": ("Expand all", "Развернуть все"),
    "collapse": ("Collapse all", "Свернуть все"),
    "blocked": ("Blocked:", "Заблокирована:"),
    "criteria": ("Acceptance criteria", "Критерии приёмки"),
    "spec": ("Spec", "Спецификация"),
    "depends": ("Depends on", "Зависит от"),
    "no_match": ("No task matches the search.", "Ни одна задача не подходит под поиск."),
    "q_note": ("From <code>questions/OPEN_QUESTIONS.md</code>. Until a question is answered, the work follows "
               "the stated behaviour.",
               "Из <code>questions/OPEN_QUESTIONS.md</code>. Пока нет ответа, работа идёт по указанному поведению."),
    "q_none": ("No open questions.", "Открытых вопросов нет."),
    "until": ("Until answered", "До ответа"),
    "blocks": ("Blocks", "Блокирует"),
    "dec_title": ("Decided and withdrawn questions", "Решённые и снятые вопросы"),
    "dec_note": ("Answers recorded in the decisions table of <code>questions/OPEN_QUESTIONS.md</code>.",
                 "Ответы из таблицы решений в <code>questions/OPEN_QUESTIONS.md</code>."),
    "dec_none": ("No decisions yet.", "Решений пока нет."),
    "decided": ("Decided", "Решён"),
    "withdrawn": ("Withdrawn", "Снят"),
    "applied": ("Applied in:", "Где применено:"),
    "footer": ("Generated from <code>specifications/</code> by <code>agent-rules/scripts/gen_project_review.py</code>; "
               "do not edit by hand. The quality gate fails when this page is stale. Russian texts of the data: "
               "<code>specifications/i18n/PROJECT_REVIEW.ru.yaml</code>.",
               "Собрано из <code>specifications/</code> скриптом <code>agent-rules/scripts/gen_project_review.py</code>; "
               "не редактировать вручную. Гейт падает, если страница устарела. Русские тексты данных: "
               "<code>specifications/i18n/PROJECT_REVIEW.ru.yaml</code>."),
}


def configure(project):
    """Apply the project settings of the registry to the page."""
    global THEME_KEY, LANG_KEY, CLIENT
    t = tracker({"project": project})
    TRACKER.update(t)
    CLIENT = project.get("client") or "the client"
    slug = re.sub(r"[^a-z0-9]+", "-", (project.get("name") or "project").lower()).strip("-") or "project"
    THEME_KEY, LANG_KEY = "%s-review-theme" % slug, "%s-review-lang" % slug
    for key, (en, ru) in UI.items():
        UI[key] = tuple(x.replace("{tracker}", esc(t["name"])).replace("{client}", esc(CLIENT)) for x in (en, ru))


def ui(key):
    return both(*UI[key])


def ui_attr(name, key):
    return attr(name, *UI[key])


def sec_head(n, title_key, note_key):
    return ('<div class="sec-head"><h2><span class="n">%02d</span>%s</h2><p class="lead">%s</p></div>'
            % (n, ui(title_key), ui(note_key)))


# ---------- page parts ----------

def criterion(text):
    m = re.match(r"^\[([^\]]+)\]\s*(.*)$", text)
    if not m:
        return '<li><span>%s</span></li>' % tx(text)
    label, body = m.groups()
    href = label_link(label)
    tag = '<span class="lbl">%s</span>' % esc(label)
    if href:
        tag = '<a class="lbl" href="%s">%s</a>' % (esc(href), esc(label))
    return '<li>%s<span>%s</span></li>' % (tag, tx(body))


# Status colours (ordinal ramps validated with the dataviz palette checks, light and dark, 2026-10-12): the
# working statuses form an ordinal one-hue ramp, "Done" and "Blocked" use the reserved status colours with an
# icon, "Not started" is neutral. The colour never carries the meaning alone: every status is shown with its label.
ICON = {"done": "✓", "blocked": "!"}


def status_chip(code, label, pill=True):
    return ('<span class="st st-%s%s"><i aria-hidden="true">%s</i>%s</span>'
            % (esc(code), " pill" if pill else "", ICON.get(code, ""), tx(label)))


def meter(p, size=""):
    return ('<span class="meter %s" role="img" %s><span class="track"><span class="fill" '
            'style="width:%d%%"></span></span><b>%d%%</b></span>'
            % (size, attr("aria-label", "%d%% ready" % p, "готовность %d%%" % p), p, p))


def task_links(ids, statuses):
    return " ".join('<a class="chip mono" href="#task-%s">%s</a>' % (esc(i), esc(i)) if i in statuses
                    else '<span class="muted">%s</span>' % tx(i) for i in ids)


# ---------- page ----------

def build():
    global RU
    reg = load_yaml(REGISTRY)
    table = {}
    if os.path.isfile(TRANSLATIONS):
        table = (load_yaml(TRANSLATIONS) or {}).get("translations") or {}
    RU = Russian(table)
    global TRANSLATION_REQUIRED
    TRANSLATION_REQUIRED = (reg.get("project") or {}).get("review_translation") == "required"

    project = reg.get("project") or {}
    configure(project)
    name = project.get("name", "project")
    tracker_url, tracker_name, tracker_label = TRACKER["url"], TRACKER["name"], TRACKER["label"]
    model = project.get("status_model") or []
    labels = {s["code"]: s["label"] for s in model}
    epics = reg.get("epics") or []
    epic_title = {e["id"]: e.get("title", "") for e in epics}
    epic_spec = {e["id"]: e.get("spec", "") for e in epics}
    tasks = reg.get("features") or []
    statuses = {t["id"]: t["status"] for t in tasks}
    source_tasks = read_source_tasks()
    q_groups, decisions = read_questions()

    known_cu = {cu for cu, _, _ in source_tasks}
    linked = [t for t in tasks if set(t.get("tracker_ids") or []) & known_cu]
    by_spec = mean([t["progress_percent"] for t in tasks])
    by_ta = mean([t["progress_percent"] for t in linked])
    open_count = sum(len(items) for _, items in q_groups)
    decided_count = sum(1 for d in decisions if d["kind"] == "decided")
    withdrawn_count = len(decisions) - decided_count
    counts = [(s["code"], s["label"], sum(1 for t in tasks if t["status"] == s["code"])) for s in model]
    total = len(tasks)

    out = []
    w = out.append

    # ----- cover: project, headline readiness, key numbers
    spec_note = both("Mean progress of all %s in the registry." % plural(total, "task", "tasks"),
                     "Средняя готовность всех задач реестра (%d)." % total)
    w('<section class="cover" id="overview" %s>' % attr("aria-label", "Overview", "Сводка"))
    w('<span class="kicker">%s</span><h1>%s</h1><p class="cover-sub">%s</p><div class="facts">'
      % (ui("subtitle"), esc(name), ui("intro")))
    if by_ta is not None:
        w('<div class="fact hero-fact"><span class="fl">%s</span><b class="hero-num">%d<small>%%</small></b>%s'
          '<span class="fn">%s</span></div>'
          % (ui("by_ta"), by_ta, meter(by_ta, "lg"), both(
              "Mean progress of %s linked to %s in <code>product/source-tasks/</code>."
              % (plural(len(linked), "task", "tasks"), plural(len(source_tasks), "%s task" % esc(tracker_name), "%s tasks" % esc(tracker_name))),
              "Средняя готовность %s, %s с %s %s в <code>product/source-tasks/</code>."
              % (ru_one(len(linked), "задачи", "задач"), ru_word(len(linked), "связанной", "связанных", "связанных"),
                 ru_one(len(source_tasks), "задачей", "задачами"), esc(tracker_name)))))
        w('<div class="fact"><span class="fl">%s</span><b>%s<small>%%</small></b>%s<span class="fn">%s</span></div>'
          % (ui("by_spec"), by_spec if by_spec is not None else 0, meter(by_spec or 0), spec_note))
    else:
        w('<div class="fact hero-fact"><span class="fl">%s</span><b class="hero-num">%d<small>%%</small></b>%s'
          '<span class="fn">%s %s</span></div>'
          % (ui("by_spec"), by_spec or 0, meter(by_spec or 0, "lg"), spec_note, both(
              "No technical assignment: no task is linked to a %s task in <code>product/source-tasks/</code>." % esc(tracker_name),
              "Технического задания нет: ни одна задача не связана с задачей %s из " % esc(tracker_name) +
              "<code>product/source-tasks/</code>.")))
    w('<div class="fact"><span class="fl">%s</span><b>%d</b><span class="fn">%s</span></div>'
      % (ui("tasks"), total, both("in the task registry", "в реестре задач")))
    w('<div class="fact"><span class="fl">%s</span><b>%d</b><span class="fn">%s</span></div>'
      % (ui("open_questions"), open_count, both("to %s; the work follows the stated behaviour until answered" % esc(CLIENT),
                                               "к %s; до ответа работа идёт по указанному поведению" % esc(CLIENT))))
    w('</div></section>')

    w('<section class="duo">')
    w('<div class="card"><h3 class="card-h">%s</h3><p class="stat-num">%d <span>%s</span></p>'
      % (ui("by_status"), total, both("task" if total == 1 else "tasks", ru_word(total, "задача", "задачи", "задач"))))
    w('<div class="stack" role="img" %s>%s</div>' % (
        attr("aria-label", ", ".join("%s: %d" % (lbl, n) for _, lbl, n in counts if n),
             ", ".join("%s: %d" % (tr(lbl), n) for _, lbl, n in counts if n)),
        "".join('<span class="seg s-%s" style="flex-grow:%d" %s></span>'
                % (esc(c), n, attr("title", "%s: %s" % (lbl, plural(n, "task", "tasks")),
                                   "%s: %s" % (tr(lbl), ru_count(n, "задача", "задачи", "задач"))))
                for c, lbl, n in counts if n)))
    w('<ul class="legend">')
    for c, lbl, n in counts:
        w('<li class="%s">%s<b>%d</b></li>' % ("zero" if not n else "", status_chip(c, lbl, pill=False), n))
    w('</ul></div>')

    w('<div class="card"><h3 class="card-h">%s</h3><p class="stat-num">%d <span>%s</span></p>'
      '<ul class="kv"><li><a href="#questions">%s</a><b>%d</b></li>'
      '<li><a href="#decisions">%s</a><b>%d</b></li><li><a href="#decisions">%s</a><b>%d</b></li></ul></div>'
      % (ui("q_card"), open_count, both("open", ru_word(open_count, "открытый", "открытых", "открытых")),
         ui("q_open"), open_count, ui("q_decided"), decided_count, ui("q_withdrawn"), withdrawn_count))
    w('</section>')

    # ----- technical assignment
    w('<section id="assignment">%s' % sec_head(1, "assignment", "ta_note"))
    if not source_tasks:
        w('<p class="empty">%s</p>' % ui("ta_none"))
    else:
        w('<ul class="rows">')
        for cu, title, created in source_tasks:
            ts = [t for t in tasks if cu in (t.get("tracker_ids") or [])]
            p = mean([t["progress_percent"] for t in ts])
            linked_html = " ".join('<a class="chip" href="#task-%s"><span class="mono">%s</span>%s</a>'
                                   % (esc(t["id"]), esc(t["id"]), status_chip(t["status"], labels.get(t["status"], t["status"]), pill=False))
                                   for t in ts) or '<span class="muted">%s</span>' % ui("no_linked")
            w('<li class="row ta"><div><a class="mono" href="product/source-tasks/%s.md">%s</a>'
              '<div class="title">%s</div><div class="meta">%s %s</div></div>'
              '<div class="linked">%s</div><div>%s</div></li>'
              % (esc(cu), esc(cu), tx(title), ui("created"), esc(created), linked_html,
                 meter(p) if p is not None else '<span class="muted">—</span>'))
        w('</ul>')
    w('</section>')

    # ----- tasks
    w('<section id="tasks">%s' % sec_head(2, "tasks", "tasks_note"))
    # The search field must not offer the browser's form history or password-manager suggestions.
    w('<div class="toolbar" id="toolbar" hidden><div class="tools">'
      '<label class="search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="m14 14 4 4"/></svg>'
      '<input id="q" type="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" '
      'enterkeyhint="search" data-lpignore="true" data-1p-ignore="true" data-form-type="other" %s %s></label>'
      '<div class="dd" id="epic"><button type="button" class="dd-btn" aria-haspopup="listbox" aria-expanded="false" %s>'
      '<span class="dd-label"></span><span class="chev" aria-hidden="true"></span></button>'
      '<ul class="dd-list" role="listbox" tabindex="-1" hidden %s>'
      '<li role="option" tabindex="-1" data-value="" aria-selected="true">%s</li>%s</ul></div>'
      '<button type="button" class="btn ghost" id="toggle" data-open="0">%s</button></div>'
      '<div class="chips" role="group" %s><button type="button" class="fchip" data-s="" aria-pressed="true">%s <b>%d</b></button>%s</div>'
      '</div>'
      % (ui_attr("placeholder", "search"), ui_attr("aria-label", "search_label"), ui_attr("aria-label", "epic"),
         ui_attr("aria-label", "epic"), ui("all_epics"),
         "".join('<li role="option" tabindex="-1" data-value="%s" aria-selected="false"><span class="mono">%s</span>'
                 '<span>%s</span></li>' % (esc(e["id"]), esc(e["id"]), tx(e.get("title", ""))) for e in epics),
         ui("expand"), ui_attr("aria-label", "status"), ui("all"), total,
         "".join('<button type="button" class="fchip" data-s="%s" aria-pressed="false">%s <b>%d</b></button>'
                 % (esc(c), tx(lbl), n) for c, lbl, n in counts if n)))
    w('<p class="count note" id="count" aria-live="polite"></p><div class="tasks">')
    for t in tasks:
        crit = t.get("acceptance_criteria") or []
        epic = t.get("epic", "")
        texts = [t.get("title", ""), epic_title.get(epic, ""), labels.get(t["status"], ""), t.get("surface", "")]
        bodies = [re.sub(r"^\[[^\]]+\]\s*", "", c) for c in crit]
        search = " ".join([t["id"], epic] + texts + crit + [tr(x) for x in texts + bodies]).lower()
        spec = epic_spec.get(epic, "")
        cu = " ".join(('<a class="chip mono" href="%s%s">%s-%s</a>' % (esc(tracker_url), esc(c), esc(tracker_label), esc(c))
                       if tracker_url else '<span class="chip mono">%s-%s</span>' % (esc(tracker_label), esc(c)))
                      for c in t.get("tracker_ids") or [])
        deps = task_links(t.get("depends_on") or [], statuses)
        w('<details class="task" id="task-%s" data-status="%s" data-epic="%s" data-search="%s">'
          % (esc(t["id"]), esc(t["status"]), esc(epic), esc(search)))
        w('<summary><span class="mono tid">%s</span><span class="tmain"><span class="title">%s</span>'
          '<span class="meta">%s — %s, %s</span>%s</span>%s%s<span class="chev" aria-hidden="true"></span></summary>'
          % (esc(t["id"]), tx(t.get("title", "")), esc(epic), tx(epic_title.get(epic, "")), tx(t.get("surface", "")),
             '<span class="blocked">%s %s</span>' % (ui("blocked"), tx(t["blocked_reason"])) if t.get("blocked_reason") else "",
             status_chip(t["status"], labels.get(t["status"], t["status"])), meter(t["progress_percent"])))
        w('<div class="tbody"><div><p class="card-h">%s (%d)</p><ul class="crit">%s</ul></div>'
          '<dl class="facts-dl"><dt>%s</dt><dd><a href="%s">%s</a></dd><dt>%s</dt><dd>%s</dd>'
          '<dt>%s</dt><dd>%s</dd></dl></div></details>'
          % (ui("criteria"), len(crit), "".join(criterion(c) for c in crit), ui("spec"), esc(spec),
             esc(os.path.basename(spec)), esc(tracker_name), cu or '<span class="muted">—</span>', ui("depends"),
             deps or '<span class="muted">—</span>'))
    w('</div><p class="empty" id="empty" hidden>%s</p></section>' % ui("no_match"))

    # ----- open questions
    w('<section id="questions">%s' % sec_head(3, "open_questions", "q_note"))
    if not open_count:
        w('<p class="empty">%s</p>' % ui("q_none"))
    for heading, items in q_groups:
        if not items:
            continue
        w('<h3>%s <span class="muted">%d</span></h3><div class="qgrid">' % (tx(heading), len(items)))
        for q in items:
            w('<article class="card q" id="%s"><p class="qhead"><span class="mono">%s</span>%s</p>'
              % (esc(q["id"]), esc(q["id"]), '<span class="meta">%s</span>' % tx(q["source"]) if q["source"] else ""))
            w('<h4>%s</h4><p>%s</p>' % (tx(q["title"]), tx(q["question"])))
            if q["until"]:
                w('<div class="until"><span class="card-h">%s</span>%s</div>' % (ui("until"), tx(q["until"])))
            if q["blocks"]:
                ids = [b.strip() for b in q["blocks"].split(",")]
                w('<p class="blocks"><span class="card-h">%s</span>%s</p>' % (ui("blocks"), task_links(ids, statuses)))
            w('</article>')
        w('</div>')
    w('</section>')

    # ----- decisions
    w('<section id="decisions">%s' % sec_head(4, "dec_title", "dec_note"))
    if not decisions:
        w('<p class="empty">%s</p>' % ui("dec_none"))
    else:
        w('<ul class="rows">')
        for d in decisions:
            kind = ('<span class="tag ok">✓ %s</span>' % ui("decided") if d["kind"] == "decided"
                    else '<span class="tag g">– %s</span>' % ui("withdrawn"))
            w('<li class="row dec" id="%s"><div><span class="mono">%s</span>%s</div><div><div class="title">%s</div>'
              '<p>%s</p><p class="meta">%s %s</p></div></li>'
              % (esc(d["id"]), esc(d["id"]), kind, tx(d["question"]), tx(d["decision"]), ui("applied"), tx(d["applied"])))
        w('</ul>')
    w('</section>')

    title_en, title_ru = "Project review — %s" % name, "Ревью проекта — %s" % name
    page = PAGE
    for key, value in (("{{TITLE}}", esc(title_en)), ("{{TITLE_EN_JS}}", js(title_en)), ("{{TITLE_RU_JS}}", js(title_ru)),
                       ("{{NAME}}", esc(name)), ("{{THEME_KEY}}", THEME_KEY), ("{{LANG_KEY}}", LANG_KEY),
                       ("{{SUBTITLE}}", ui("subtitle")), ("{{NAV}}", ui_attr("aria-label", "sections")),
                       ("{{NAV_ASSIGNMENT}}", ui("assignment")), ("{{NAV_TASKS}}", ui("tasks")),
                       ("{{NAV_QUESTIONS}}", ui("open_questions")), ("{{NAV_DECISIONS}}", ui("decisions")),
                       ("{{THEME}}", ui_attr("aria-label", "theme")), ("{{LIGHT}}", ui("light")),
                       ("{{DARK}}", ui("dark")), ("{{SYSTEM}}", ui("system")),
                       ("{{LANGUAGE}}", ui_attr("aria-label", "language")), ("{{FOOTER}}", ui("footer")),
                       ("{{EXPAND_EN}}", UI["expand"][0]), ("{{EXPAND_RU}}", UI["expand"][1]),
                       ("{{COLLAPSE_EN}}", UI["collapse"][0]), ("{{COLLAPSE_RU}}", UI["collapse"][1])):
        page = page.replace(key, value)
    return page.replace("{{BODY}}", "\n".join(out))


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}}</title>
<meta name="description" content="Tasks, statuses, readiness and questions of the project, built from specifications/.">
<!-- GENERATED by agent-rules/scripts/gen_project_review.py from specifications/; do not edit. -->
<script>
try {
  var t = localStorage.getItem('{{THEME_KEY}}'); if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  if (localStorage.getItem('{{LANG_KEY}}') === 'ru') { document.documentElement.setAttribute('data-lang', 'ru'); document.documentElement.lang = 'ru'; }
} catch (e) {}
</script>
<style>
/* Warm grey page, white cards, yellow accent, dark cover.
   Fonts are named first and used only when installed locally: the page loads no external resources. */
:root {
  color-scheme: light;
  --bg: #efefed; --surface: #ffffff; --surface-2: #f5f5f4; --line: #e1e1de;
  --ink: #0e0e0e; --text-2: #5c5c5c; --text-3: #8a8a86; --link: #2459d6;
  --accent: #ffd600; --accent-ink: #0e0e0e; --accent-soft: #fff5bf; --accent-text: #7a6000;
  --ok: #12823b; --ok-soft: #e3f4e8;
  --meter: #0e0e0e; --track: #e6e6e3;
  --cover: #0e0e0e; --cover-line: rgba(255, 255, 255, .14);
  --s-planned: #a8a6a0; --s-in_progress: #86b6ef; --s-code_review: #5598e7; --s-review_fixes: #2a78d6;
  --s-ready_for_review: #1c5cab; --s-ready_for_test: #104281; --s-done: #0ca30c; --s-blocked: #d03b3b;
  --shadow: 0 1px 2px rgba(0, 0, 0, .04), 0 4px 16px rgba(0, 0, 0, .04);
  --pop: 0 12px 32px rgba(0, 0, 0, .14), 0 2px 6px rgba(0, 0, 0, .06);
  --font-head: "Unbounded", "Halvar Breitschrift", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-text: "Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --radius: 16px;
}
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) {
    color-scheme: dark;
    --bg: #0c0c0d; --surface: #161618; --surface-2: #1f1f22; --line: #2c2c30;
    --ink: #f2f2f2; --text-2: #a5a5a5; --text-3: #7c7c80; --link: #7fa6ff;
    --accent-soft: rgba(255, 214, 0, .13); --accent-text: #ffd600;
    --ok: #45c174; --ok-soft: rgba(69, 193, 116, .14);
    --meter: #f2f2f2; --track: #2c2c30;
    --cover: #000000; --cover-line: rgba(255, 255, 255, .12);
    --s-planned: #6b6a64; --s-in_progress: #256abf; --s-code_review: #3987e5; --s-review_fixes: #6da7ec;
    --s-ready_for_review: #9ec5f4; --s-ready_for_test: #cde2fb;
    --shadow: none; --pop: 0 12px 32px rgba(0, 0, 0, .5);
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0c0c0d; --surface: #161618; --surface-2: #1f1f22; --line: #2c2c30;
  --ink: #f2f2f2; --text-2: #a5a5a5; --text-3: #7c7c80; --link: #7fa6ff;
  --accent-soft: rgba(255, 214, 0, .13); --accent-text: #ffd600;
  --ok: #45c174; --ok-soft: rgba(69, 193, 116, .14);
  --meter: #f2f2f2; --track: #2c2c30;
  --cover: #000000; --cover-line: rgba(255, 255, 255, .12);
  --s-planned: #6b6a64; --s-in_progress: #256abf; --s-code_review: #3987e5; --s-review_fixes: #6da7ec;
  --s-ready_for_review: #9ec5f4; --s-ready_for_test: #cde2fb;
  --shadow: none; --pop: 0 12px 32px rgba(0, 0, 0, .5);
}

* { box-sizing: border-box; }
/* --hdr and --tb (heights of the sticky header and the sticky task toolbar) are measured by the script below. */
html { scroll-behavior: smooth; scroll-padding-top: calc(var(--hdr, 61px) + 16px); -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15.5px/1.6 var(--font-text); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
h1, h2, h3, h4 { font-family: var(--font-head); font-weight: 700; letter-spacing: -.01em; line-height: 1.2; margin: 0; }
p { margin: 0; }
a { color: var(--link); text-decoration: none; } a:hover { text-decoration: underline; }
code { font: .86em var(--font-mono); background: var(--surface-2); border: 1px solid var(--line); border-radius: 6px; padding: 1px 6px; }
.mono { font: 600 12.5px var(--font-mono); letter-spacing: -.01em; }
.muted { color: var(--text-3); }
.meta { color: var(--text-3); font-size: 13px; }
:focus-visible { outline: 2px solid var(--link); outline-offset: 2px; }

/* languages: both texts are in the page, one is shown */
[data-l="ru"] { display: none; }
html[data-lang="ru"] [data-l="ru"] { display: inline; }
html[data-lang="ru"] [data-l="en"] { display: none; }
/* Header switches keep one width in both languages: both labels share a grid cell, the other one is invisible.
   The display rule must outrank html[data-lang="ru"] [data-l="en"], or the English label would leave the cell. */
.seg button { display: inline-grid; justify-items: center; }
:root .seg button [data-l] { grid-area: 1 / 1; display: inline; }
.seg [data-l="ru"], html[data-lang="ru"] .seg [data-l="en"] { visibility: hidden; }
html[data-lang="ru"] .seg [data-l="ru"] { visibility: visible; }

/* header */
header { position: sticky; top: 0; z-index: 20; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: saturate(160%) blur(10px); -webkit-backdrop-filter: saturate(160%) blur(10px); border-bottom: 1px solid var(--line); }
.bar, main, footer { max-width: 1180px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }
.bar { display: flex; align-items: center; gap: 20px; min-height: 60px; }
.brand { display: flex; align-items: center; gap: 10px; color: var(--ink); white-space: nowrap; }
.brand:hover { text-decoration: none; }
.brand b { font: 700 14px var(--font-head); }
.bar nav { display: flex; gap: 16px; font-size: 13.5px; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.bar nav a { color: var(--text-2); white-space: nowrap; } .bar nav a:hover { color: var(--ink); text-decoration: none; }
.spacer { flex: 1; }
.seg { display: inline-flex; background: var(--surface-2); border: 1px solid var(--line); border-radius: 12px; padding: 3px; gap: 2px; }
.seg button { font: 600 13px/1 var(--font-text); color: var(--text-2); background: transparent; border: 0; padding: 8px 11px; border-radius: 9px; cursor: pointer; white-space: nowrap; }
.seg button[aria-pressed="true"] { background: var(--surface); color: var(--ink); box-shadow: 0 1px 3px rgba(0, 0, 0, .12); }

.tag { display: inline-flex; align-items: center; gap: 6px; font: 700 12px/1 var(--font-text); padding: 7px 10px; border-radius: 999px; white-space: nowrap; }
.tag.y { background: var(--accent); color: var(--accent-ink); }
.tag.g { background: var(--surface-2); color: var(--text-2); border: 1px solid var(--line); }
.tag.ok { background: var(--ok-soft); color: var(--ok); }

main { padding-top: 28px; padding-bottom: 40px; }
section { margin: 0 0 56px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 22px 24px; box-shadow: var(--shadow); min-width: 0; }

/* cover */
.cover { position: relative; overflow: hidden; background: var(--cover); color: #fff; border-radius: 28px; padding: clamp(28px, 4.5vw, 56px); margin-bottom: 16px; }
.cover::after { content: ""; position: absolute; right: -140px; top: -140px; width: 440px; height: 440px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 214, 0, .22), rgba(255, 214, 0, 0) 68%); pointer-events: none; }
.kicker { display: inline-block; font: 700 12px/1 var(--font-head); letter-spacing: .05em; text-transform: uppercase; background: var(--accent); color: var(--accent-ink); border-radius: 8px; padding: 7px 9px; }
.cover h1 { font-size: clamp(32px, 5.2vw, 60px); font-weight: 800; letter-spacing: -.02em; margin: 22px 0 12px; }
.cover-sub { color: #d6d6d6; font-size: clamp(15.5px, 1.6vw, 18px); max-width: 720px; }
.cover code { background: rgba(255, 255, 255, .08); border-color: rgba(255, 255, 255, .14); color: #f2f2f2; }
.facts { position: relative; z-index: 1; display: grid; grid-template-columns: 1.5fr 1fr .7fr .9fr; gap: 28px; margin-top: 44px; }
.fact { border-top: 2px solid var(--cover-line); padding-top: 16px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.fl { font: 700 11.5px/1.3 var(--font-head); letter-spacing: .05em; text-transform: uppercase; color: #a9a9a9; }
.fact b { font: 800 clamp(28px, 3.2vw, 40px)/1 var(--font-head); color: #fff; letter-spacing: -.02em; }
.fact b small { font-size: .5em; margin-left: 2px; color: #a9a9a9; }
.fact .hero-num { font-size: clamp(56px, 7vw, 88px); color: var(--accent); }
.fact .hero-num small { color: var(--accent); opacity: .7; }
.fn { font-size: 13.5px; color: #a9a9a9; }
.hero-fact { border-top-color: var(--accent); }

/* meters: monochrome on cards, yellow on the cover */
.meter { display: inline-flex; align-items: center; gap: 10px; width: 100%; }
.meter .track { flex: 1; height: 6px; background: var(--track); border-radius: 4px; overflow: hidden; }
.meter .fill { display: block; height: 100%; background: var(--meter); border-radius: 4px; }
.meter b { min-width: 3.1em; text-align: right; font: 700 14px var(--font-text); font-variant-numeric: tabular-nums; }
.cover .meter .track { background: rgba(255, 255, 255, .14); }
.cover .meter .fill { background: #f2f2f2; }
.cover .meter b { display: none; }
.cover .meter.lg .track { height: 10px; border-radius: 6px; }
.cover .meter.lg .fill { background: var(--accent); }

/* overview cards */
.duo { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }
.card-h { font: 700 12px/1.3 var(--font-head); letter-spacing: .05em; text-transform: uppercase; color: var(--text-2); margin: 0 0 12px; }
.stat-num { font: 800 34px/1 var(--font-head); letter-spacing: -.02em; margin-bottom: 18px; }
.stat-num span { font: 600 14px var(--font-text); color: var(--text-2); letter-spacing: 0; margin-left: 4px; }
.stack { display: flex; gap: 3px; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 18px; }
.stack .seg { min-width: 8px; background: var(--sc); }
.legend { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 28px; }
.legend li, .kv li { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.legend b, .kv b { font: 700 15px var(--font-text); font-variant-numeric: tabular-nums; }
.legend li.zero { opacity: .4; }
.kv { list-style: none; margin: 0; padding: 0; }
.kv li { padding: 11px 0; border-bottom: 1px solid var(--line); font-size: 15px; } .kv li:last-child { border-bottom: 0; }
.kv a { color: var(--ink); } .kv a::after { content: " →"; color: var(--text-3); }

/* statuses */
.st { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ink); white-space: nowrap; }
.st i { flex: none; width: 9px; height: 9px; border-radius: 50%; background: var(--sc); font-style: normal; }
.st-done i, .st-blocked i { width: 16px; height: 16px; display: inline-grid; place-items: center; font: 800 10px/1 system-ui, sans-serif; color: #fff; }
.st.pill { justify-self: start; padding: 6px 11px 6px 9px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--line); font-weight: 600; font-size: 13px; }
.st-planned, .s-planned { --sc: var(--s-planned); } .st-in_progress, .s-in_progress { --sc: var(--s-in_progress); }
.st-code_review, .s-code_review { --sc: var(--s-code_review); } .st-review_fixes, .s-review_fixes { --sc: var(--s-review_fixes); }
.st-ready_for_review, .s-ready_for_review { --sc: var(--s-ready_for_review); } .st-ready_for_test, .s-ready_for_test { --sc: var(--s-ready_for_test); }
.st-done, .s-done { --sc: var(--s-done); } .st-blocked, .s-blocked { --sc: var(--s-blocked); }

/* section heads */
.sec-head { margin-bottom: 20px; }
.sec-head h2 { display: flex; align-items: center; gap: 14px; font-size: clamp(24px, 2.8vw, 32px); }
.sec-head h2 .n { font: 700 13px/1 var(--font-head); background: var(--accent); color: var(--accent-ink); border-radius: 8px; padding: 7px 8px; letter-spacing: .02em; }
.lead { margin-top: 10px; color: var(--text-2); font-size: 16px; max-width: 860px; }
h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-2); margin: 28px 0 12px; }
h3 .muted { margin-left: 6px; }

.chip { display: inline-flex; align-items: center; gap: 8px; padding: 5px 11px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface-2); color: var(--ink); font-size: 13px; margin: 3px 6px 3px 0; }
.chip:hover { text-decoration: none; border-color: var(--text-3); }
.chip .st { font-size: 12.5px; }

/* lists of rows */
.rows { list-style: none; margin: 0; padding: 0; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
.row { display: grid; gap: 24px; padding: 18px 24px; border-bottom: 1px solid var(--line); align-items: center; }
.row:last-child { border-bottom: 0; }
.row.ta { grid-template-columns: minmax(240px, 1.3fr) 1.4fr 190px; }
.row .title { font-weight: 700; margin: 3px 0; }
.row.dec { grid-template-columns: 160px 1fr; align-items: start; }
.row.dec > div:first-child { display: grid; gap: 8px; justify-items: start; }
.row.dec p { margin-top: 6px; color: var(--text-2); } .row.dec p.meta { color: var(--text-3); }

/* toolbar */
.toolbar { position: sticky; top: 61px; z-index: 10; padding: 12px 0; background: var(--bg); }
.tools { display: flex; gap: 10px; align-items: stretch; }
.search { flex: 1; position: relative; display: flex; align-items: center; }
.search svg { position: absolute; left: 14px; width: 18px; height: 18px; fill: none; stroke: var(--text-3); stroke-width: 1.8; stroke-linecap: round; pointer-events: none; }
.search input { width: 100%; height: 46px; padding: 0 16px 0 42px; font: 500 15px var(--font-text); color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 12px; outline: none; transition: border-color .15s, box-shadow .15s; }
.search input::placeholder { color: var(--text-3); }
.search input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 55%, transparent); }
.btn { font: 700 13.5px/1 var(--font-text); height: 46px; padding: 0 16px; border-radius: 12px; cursor: pointer; white-space: nowrap; }
.btn.ghost { background: var(--surface); color: var(--ink); border: 1px solid var(--line); }
.btn.ghost:hover { border-color: var(--text-3); }

/* custom dropdown */
.dd { position: relative; min-width: 260px; }
.dd-btn { width: 100%; height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 14px 0 16px; font: 600 14px var(--font-text); color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 12px; cursor: pointer; text-align: left; }
.dd-btn:hover { border-color: var(--text-3); }
.dd.open .dd-btn { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 55%, transparent); }
.dd.set .dd-btn { background: var(--accent-soft); border-color: color-mix(in srgb, var(--accent) 70%, var(--line)); }
.dd-label { display: flex; gap: 8px; align-items: baseline; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dd-label .mono { font-size: 12px; color: var(--text-2); }
.dd-btn .chev { flex: none; width: 8px; height: 8px; margin-top: -4px; border-right: 2px solid var(--text-2); border-bottom: 2px solid var(--text-2); transform: rotate(45deg); transition: transform .15s; }
.dd.open .dd-btn .chev { transform: rotate(-135deg); margin-top: 4px; }
.dd-list { position: absolute; right: 0; top: calc(100% + 8px); z-index: 30; width: max(100%, 460px); max-height: 380px; overflow: auto; margin: 0; padding: 6px; list-style: none; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; box-shadow: var(--pop); }
.dd-list li { display: grid; grid-template-columns: 116px 1fr 16px; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px; cursor: pointer; font-size: 14px; outline: none; }
.dd-list li:first-child { grid-template-columns: 1fr 16px; font-weight: 600; }
.dd-list li .mono { color: var(--text-2); font-size: 12px; }
.dd-list li:hover, .dd-list li:focus { background: var(--surface-2); }
.dd-list li[aria-selected="true"]::after { content: "✓"; font-weight: 800; color: var(--ink); justify-self: end; }
.dd-list li[aria-selected="true"] { background: var(--accent-soft); }

.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.fchip { font: 600 13px/1 var(--font-text); padding: 9px 13px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--text-2); cursor: pointer; }
.fchip:hover { color: var(--ink); border-color: var(--text-3); }
.fchip b { margin-left: 6px; font-weight: 700; color: var(--text-3); font-variant-numeric: tabular-nums; }
.fchip[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.fchip[aria-pressed="true"] b { color: var(--accent-ink); opacity: .65; }
.count { margin: 4px 0 12px; color: var(--text-3); font-size: 13.5px; }

/* tasks */
.tasks { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
.task { border-bottom: 1px solid var(--line); scroll-margin-top: var(--tb, 0px); } .task:last-child { border-bottom: 0; }
.task summary { list-style: none; display: grid; grid-template-columns: 140px minmax(0, 1fr) 190px 160px 14px; gap: 20px; align-items: center; padding: 18px 24px; cursor: pointer; transition: background .12s; }
.task summary::-webkit-details-marker { display: none; }
.task summary:hover { background: var(--surface-2); }
.tid { color: var(--text-2); }
.tmain { display: grid; gap: 3px; min-width: 0; } .tmain .title { font-weight: 700; }
.blocked { color: var(--s-blocked); font-size: 13px; font-weight: 600; }
.chev { width: 8px; height: 8px; border-right: 2px solid var(--text-3); border-bottom: 2px solid var(--text-3); transform: rotate(-45deg); transition: transform .15s; }
.task[open] summary .chev { transform: rotate(45deg); }
.task[open] summary { background: var(--surface-2); }
.tbody { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 32px; padding: 20px 24px 24px 184px; border-top: 1px solid var(--line); }
.tbody .card-h { margin-bottom: 14px; }
.crit { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.crit li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 12px; align-items: baseline; font-size: 15px; }
.crit li > span, .tmain, .row > div, .q { min-width: 0; overflow-wrap: anywhere; }
.tbody > * { min-width: 0; }
.lbl { font: 700 11px var(--font-mono); padding: 3px 7px; border-radius: 6px; background: var(--surface-2); border: 1px solid var(--line); color: var(--text-2); white-space: nowrap; }
a.lbl { color: var(--link); } a.lbl:hover { text-decoration: none; border-color: var(--link); }
.facts-dl { margin: 0; display: grid; grid-template-columns: 110px 1fr; gap: 10px 14px; font-size: 14px; align-content: start; background: var(--surface-2); border-radius: 12px; padding: 16px 18px; }
.facts-dl dt { color: var(--text-3); } .facts-dl dd { margin: 0; word-break: break-word; }

/* questions */
.qgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.q { display: flex; flex-direction: column; gap: 10px; }
.qhead { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.qhead .mono { background: var(--accent); color: var(--accent-ink); border-radius: 6px; padding: 3px 7px; font-size: 12px; }
.q h4 { font-size: 16px; line-height: 1.35; } .q > p { color: var(--text-2); font-size: 14.5px; }
.until { background: var(--accent-soft); border-radius: 12px; padding: 12px 14px; font-size: 14px; }
.until .card-h, .blocks .card-h { display: block; margin: 0 0 6px; font-size: 11px; color: var(--accent-text); }
.blocks .card-h { color: var(--text-3); }
.blocks { margin-top: auto !important; }

.empty { color: var(--text-3); }
.card:target, .row:target, .task:target { outline: 2px solid var(--accent); outline-offset: -1px; }
footer { border-top: 1px solid var(--line); padding-top: 20px; padding-bottom: 48px; color: var(--text-3); font-size: 13px; }

@media (max-width: 1160px) { .bar nav { display: none; } }
@media (max-width: 1000px) {
  .facts { grid-template-columns: 1fr 1fr; }
  .duo { grid-template-columns: 1fr; }
  .row.ta { grid-template-columns: 1fr; gap: 12px; }
  .task summary { grid-template-columns: 1fr auto; gap: 8px 14px; }
  .task summary .tid, .task summary .tmain { grid-column: 1 / -1; }
  .task summary .chev { display: none; }
  .tbody { grid-template-columns: minmax(0, 1fr); padding-left: 24px; }
}
@media (max-width: 720px) {
  .bar, main, footer { padding-left: 16px; padding-right: 16px; }
  .bar { flex-wrap: wrap; gap: 8px 12px; padding-top: 10px; padding-bottom: 10px; }
  .bar .spacer { display: none; }
  .tools { flex-wrap: wrap; } .search { flex-basis: 100%; } .dd { flex: 1; min-width: 0; }
  .dd-list { width: calc(100vw - 32px); max-width: 420px; left: 0; right: auto; }
  .toolbar { position: static; }
  .facts { grid-template-columns: 1fr; gap: 20px; }
  .legend { grid-template-columns: 1fr; }
  .row, .task summary, .tbody { padding-left: 18px; padding-right: 18px; }
  .row.dec { grid-template-columns: 1fr; }
  .qgrid { grid-template-columns: 1fr; }
  .cover { border-radius: 22px; }
}
</style>
</head>
<body>
<header><div class="bar">
  <a class="brand" href="#overview"><b>{{NAME}}</b></a>
  <nav {{NAV}}><a href="#assignment">{{NAV_ASSIGNMENT}}</a><a href="#tasks">{{NAV_TASKS}}</a><a href="#questions">{{NAV_QUESTIONS}}</a><a href="#decisions">{{NAV_DECISIONS}}</a></nav>
  <div class="spacer"></div>
  <!-- Language switch last: its width does not change with the language, so it stays in place when clicked. -->
  <div class="seg" role="group" {{THEME}}><button type="button" data-theme-set="light">{{LIGHT}}</button><button type="button" data-theme-set="dark">{{DARK}}</button><button type="button" data-theme-set="system">{{SYSTEM}}</button></div>
  <div class="seg" role="group" {{LANGUAGE}}><button type="button" data-lang-set="en" lang="en">English</button><button type="button" data-lang-set="ru" lang="ru">Русский</button></div>
</div></header>
<main>
{{BODY}}
</main>
<footer>{{FOOTER}}</footer>
<script>
(function () {
  var root = document.documentElement;
  function store(key, value) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) {} }
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function press(sel, attr, v) { document.querySelectorAll(sel).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === v)); }); }

  var THEME = '{{THEME_KEY}}', saved = read(THEME);
  press('[data-theme-set]', 'data-theme-set', saved === 'light' || saved === 'dark' ? saved : 'system');
  document.querySelectorAll('[data-theme-set]').forEach(function (b) { b.addEventListener('click', function () {
    var v = b.getAttribute('data-theme-set');
    if (v === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', v);
    store(THEME, v === 'system' ? null : v); press('[data-theme-set]', 'data-theme-set', v);
  }); });

  var LANG = '{{LANG_KEY}}', lang = root.getAttribute('data-lang') === 'ru' ? 'ru' : 'en', refresh = function () {};
  var TITLES = { en: {{TITLE_EN_JS}}, ru: {{TITLE_RU_JS}} };
  function setLang(v) {
    lang = v;
    if (v === 'ru') root.setAttribute('data-lang', 'ru'); else root.removeAttribute('data-lang');
    root.lang = v; document.title = TITLES[v];
    ['placeholder', 'aria-label', 'title'].forEach(function (a) {
      document.querySelectorAll('[data-' + v + '-' + a + ']').forEach(function (el) { el.setAttribute(a, el.getAttribute('data-' + v + '-' + a)); });
    });
    document.querySelectorAll('[data-' + v + '-text]').forEach(function (el) { el.textContent = el.getAttribute('data-' + v + '-text'); });
    press('[data-lang-set]', 'data-lang-set', v); refresh();
  }
  document.querySelectorAll('[data-lang-set]').forEach(function (b) { b.addEventListener('click', function () {
    var v = b.getAttribute('data-lang-set'); store(LANG, v === 'en' ? null : v); setLang(v);
  }); });

  var bar = document.getElementById('toolbar'), resetFilters = function () {};
  // Anchors scroll below the sticky header and, for tasks, below the sticky toolbar (CSS --hdr, --tb).
  function layout() {
    root.style.setProperty('--hdr', document.querySelector('header').offsetHeight + 'px');
    root.style.setProperty('--tb', bar && !bar.hidden && getComputedStyle(bar).position === 'sticky' ? bar.offsetHeight + 'px' : '0px');
  }
  function openTarget() {
    var id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    var el = id && document.getElementById(id);
    if (!el || el.tagName !== 'DETAILS') return;
    if (el.hidden) resetFilters();
    el.open = true; el.scrollIntoView();
  }

  if (bar) {
    bar.hidden = false;
    var q = document.getElementById('q'), status = '', epic = '';
    var chips = Array.prototype.slice.call(bar.querySelectorAll('.fchip'));
    var tasks = Array.prototype.slice.call(document.querySelectorAll('.task'));
    var count = document.getElementById('count'), empty = document.getElementById('empty'), toggle = document.getElementById('toggle');
    var LABELS = { en: ['{{EXPAND_EN}}', '{{COLLAPSE_EN}}'], ru: ['{{EXPAND_RU}}', '{{COLLAPSE_RU}}'] };
    var apply = function () {
      var words = q.value.toLowerCase().split(/\\s+/).filter(Boolean), n = 0;
      tasks.forEach(function (t) {
        var ok = (!status || t.dataset.status === status) && (!epic || t.dataset.epic === epic) &&
          words.every(function (w) { return t.dataset.search.indexOf(w) >= 0; });
        t.hidden = !ok; if (ok) n++;
      });
      var all = tasks.length;
      count.textContent = lang === 'ru'
        ? (n === all ? 'Все задачи: ' + all : 'Показано: ' + n + ' из ' + all)
        : (n === all ? 'All ' + all + (all === 1 ? ' task' : ' tasks') : 'Shown ' + n + ' of ' + all + (all === 1 ? ' task' : ' tasks'));
      empty.hidden = n > 0;
      toggle.textContent = LABELS[lang][Number(toggle.dataset.open)];
    };
    refresh = apply;
    chips.forEach(function (c) { c.addEventListener('click', function () {
      status = c.dataset.s; chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); }); apply();
    }); });
    q.addEventListener('input', apply);

    // Epic dropdown: a button and a listbox (keyboard: arrows, Enter, Escape; click outside closes).
    var dd = document.getElementById('epic'), ddBtn = dd.querySelector('.dd-btn'), ddList = dd.querySelector('.dd-list');
    var opts = Array.prototype.slice.call(ddList.querySelectorAll('[role="option"]'));
    var ddLabel = dd.querySelector('.dd-label');
    function current() { return opts.filter(function (o) { return o.getAttribute('aria-selected') === 'true'; })[0] || opts[0]; }
    function showLabel() { ddLabel.innerHTML = current().innerHTML; }
    function openDd(focus) { ddList.hidden = false; ddBtn.setAttribute('aria-expanded', 'true'); dd.classList.add('open'); (focus || current()).focus(); }
    function closeDd(back) { ddList.hidden = true; ddBtn.setAttribute('aria-expanded', 'false'); dd.classList.remove('open'); if (back) ddBtn.focus(); }
    function choose(o) {
      opts.forEach(function (x) { x.setAttribute('aria-selected', String(x === o)); });
      epic = o.dataset.value; dd.classList.toggle('set', !!epic); showLabel(); closeDd(true); apply();
    }
    ddBtn.addEventListener('click', function () { if (ddList.hidden) openDd(); else closeDd(); });
    ddBtn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openDd(); } });
    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { choose(o); });
      o.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); (opts[i + 1] || o).focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); (opts[i - 1] || o).focus(); }
        else if (e.key === 'Home') { e.preventDefault(); opts[0].focus(); }
        else if (e.key === 'End') { e.preventDefault(); opts[opts.length - 1].focus(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(o); }
        else if (e.key === 'Escape') { e.preventDefault(); closeDd(true); }
        else if (e.key === 'Tab') { closeDd(false); }
      });
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) closeDd(false); });
    showLabel();
    // A link to a task hidden by the filters clears them, so the counter and the controls stay true.
    resetFilters = function () {
      q.value = ''; status = ''; epic = '';
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(!x.dataset.s)); });
      opts.forEach(function (x) { x.setAttribute('aria-selected', String(x === opts[0])); });
      dd.classList.remove('set'); showLabel(); apply();
    };
    toggle.addEventListener('click', function () {
      var open = toggle.dataset.open !== '1';
      tasks.forEach(function (t) { if (!t.hidden) t.open = open; });
      toggle.dataset.open = open ? '1' : '0'; apply();
    });
  }
  setLang(lang);
  layout(); window.addEventListener('resize', layout);
  if (window.ResizeObserver) { var ro = new ResizeObserver(layout); ro.observe(document.querySelector('header')); if (bar) ro.observe(bar); }
  window.addEventListener('hashchange', openTarget); openTarget();
})();
</script>
</body>
</html>
"""


def write_missing(missing):
    """Print missing translations as YAML entries to paste into TRANSLATIONS and fill."""
    print("# Missing Russian translations for %s:" % rel(TRANSLATIONS))
    for en in missing:
        print("  %s: \"\"" % json.dumps(en, ensure_ascii=False))


def main():
    check = "--check" in sys.argv[1:]
    try:
        content = build()
    except ToolMissing as e:
        print("SKIP: %s" % e)
        return 3
    except ValueError as e:
        print("FAIL: %s" % e)
        return 1
    if "--missing" in sys.argv[1:]:
        write_missing(RU.missing)
        return 1 if RU.missing else 0
    problems = []
    if TRANSLATION_REQUIRED:
        problems += ["no Russian translation for %s" % json.dumps(en, ensure_ascii=False) for en in RU.missing]
        problems += ["unused translation %s" % json.dumps(en, ensure_ascii=False) for en in RU.unused()]
    if check:
        current = open(OUT, encoding="utf-8").read() if os.path.isfile(OUT) else ""
        if current != content:
            problems.insert(0, "%s is stale — run python3 agent-rules/scripts/gen_project_review.py" % rel(OUT))
    else:
        open(OUT, "w", encoding="utf-8").write(content)
        print("written", rel(OUT))
    if problems:
        print("FAIL: %d problem(s) in the project review (%s; add missing entries with --missing):"
              % (len(problems), rel(TRANSLATIONS)))
        for p in problems:
            print("  - " + p)
        return 1
    if check:
        print("Project review: up to date%s" % (", Russian translation complete" if TRANSLATION_REQUIRED else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
