from __future__ import annotations

import html
import json
import logging
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from terrarium_contracts import AgentJob, AgentResult, FileMap, Intent, Stack

_SAFE_PATH = re.compile(r"^(?!\.)[a-zA-Z0-9._/-]+$")
_ALLOWED_SUFFIX = {".html", ".css", ".js", ".json", ".md", ".svg", ".txt"}
_KNOWN_STACKS = frozenset({"react", "fullstack"})
_MAX_FILE_BYTES = 256_000
# Keyword scan, not a real architecture pass. Upgrade: always take the LLM plan when live models stay cheap.
_COMPLEX = re.compile(
    r"\b(auth|logins?|sign[- ]?up|dashboard|admin|crm|inventory|kanban|"
    r"checkout|payments?|roles?|permissions?|multi[- ]page|multiple screens|"
    r"websocket|real[- ]?time|saas|onboarding|settings page|workflow)\b",
    re.I,
)
# First-match layout by UI shape. Upgrade: Intent.layout once the contract grows.
_BOARD_RE = re.compile(
    r"\b(tic[\s-]*tac|chess|bingo|memory game|puzzle|tiles?|board game|\bgames?\b)\b",
    re.I,
)
_SPLIT_RE = re.compile(
    r"\b(website|web site|landing|portfolio|blog|menu|restaurant|homepage|web page)\b",
    re.I,
)
_FORM_RE = re.compile(
    r"\b(calculat|convert|json|csv|excel|timer|pomodoro|translat|search|percent|tax|tip)\b",
    re.I,
)
_LIST_RE = re.compile(
    r"\b(track|todo|task|dashboard|inventory|crm|list|recipe|note|item)\b", re.I
)
_CDN_RE = re.compile(
    r"unpkg\.com|cdnjs\.cloudflare|jsdelivr\.net|esm\.sh|skypack\.dev|"
    r"react@\d|react-dom@|babel\.min|text/babel|cdn\.jsdelivr",
    re.I,
)
_ROOT_BLOCK = re.compile(r":root\s*\{[^}]*\}", re.S)

Complexity = Literal["basic", "complex"]
Layout = Literal["board", "form", "list", "split"]
ThemeName = Literal["maroon", "light", "dark", "modern"]
# Look tag from the parent UI, not a contract field. Upgrade: CreateSessionRequest.look.
_LOOK_TAG = re.compile(r"\[look=(modern|classic|dark)\]|look:\s*(modern|classic|dark)", re.I)

_THEMES: dict[ThemeName, dict[str, str]] = {
    "maroon": {
        "bg": "#f7f3f2",
        "ink": "#1c1114",
        "accent": "#6e1429",
        "muted": "#5c4a4e",
        "surface": "#ffffff",
        "line": "#eadfde",
        "radius": "1rem",
    },
    "light": {
        "bg": "#f7f7f8",
        "ink": "#171717",
        "accent": "#1d4ed8",
        "muted": "#525252",
        "surface": "#ffffff",
        "line": "#e5e5e5",
        "radius": "1rem",
    },
    "modern": {
        "bg": "#f4f6fb",
        "ink": "#0f172a",
        "accent": "#2563eb",
        "muted": "#64748b",
        "surface": "#ffffff",
        "line": "#e2e8f0",
        "radius": "1.25rem",
    },
    "dark": {
        "bg": "#161314",
        "ink": "#f4ecee",
        "accent": "#e8b4bc",
        "muted": "#c4b4b8",
        "surface": "#221c1e",
        "line": "#3a3032",
        "radius": "1rem",
    },
}


class CodeGeneratorError(ValueError):
    pass


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SessionPlan:
    """Per-session design. Not a frozen contract — internal to Code Generator."""

    complexity: Complexity
    stack: Stack
    screens: tuple[str, ...]
    data: tuple[str, ...]
    files: tuple[str, ...]
    notes: str
    layout: Layout = "form"
    theme: ThemeName = "maroon"

    def to_payload(self) -> dict[str, object]:
        return {
            "complexity": self.complexity,
            "stack": self.stack,
            "screens": list(self.screens),
            "data": list(self.data),
            "files": list(self.files),
            "notes": self.notes,
            "layout": self.layout,
            "theme": self.theme,
        }


def templates_root() -> Path:
    override = os.environ.get("TERRARIUM_TEMPLATES_DIR")
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[2] / "templates"


def load_template(stack: Stack) -> FileMap:
    if stack not in _KNOWN_STACKS:
        raise CodeGeneratorError(f'Unknown stack "{stack}"')
    files = _load_kit(stack)
    files["styles.css"] = _shell_css()
    return files


def _shell_css() -> str:
    path = templates_root() / "shell" / "styles.css"
    if not path.is_file():
        raise CodeGeneratorError(f"Shell CSS missing at {path}")
    return path.read_text(encoding="utf-8")


def _site_css() -> str:
    path = templates_root() / "shell" / "site.css"
    if not path.is_file():
        return ""
    return path.read_text(encoding="utf-8")


def _load_layout(name: Layout) -> FileMap:
    files = _load_kit(f"layouts/{name}")
    css = _shell_css()
    if name == "split":
        css = f"{css}\n{_site_css()}"
    files["styles.css"] = css
    return files


def pick_layout(job: AgentJob) -> Layout:
    blob = f"{job.intent.summary} {job.prompt}"
    if _BOARD_RE.search(blob):
        return "board"
    if _SPLIT_RE.search(blob):
        return "split"
    if _FORM_RE.search(blob):
        return "form"
    if _LIST_RE.search(blob):
        return "list"
    return "form"


def pick_theme(job: AgentJob) -> ThemeName:
    blob = f"{job.intent.summary} {job.prompt}"
    tagged = _LOOK_TAG.search(blob)
    if tagged:
        value = (tagged.group(1) or tagged.group(2)).lower()
        if value == "classic":
            return "maroon"
        if value == "modern":
            return "modern"
        return "dark"
    if re.search(r"\b(dark mode|dark theme|\bdark\b)", blob, re.I):
        return "dark"
    if re.search(r"\bmodern (ui|design|look)\b", blob, re.I):
        return "modern"
    if re.search(r"\b(light mode|light theme|\blight\b)", blob, re.I):
        return "light"
    return "maroon"


def _root_css(theme: ThemeName) -> str:
    tokens = _THEMES[theme]
    return (
        ":root {\n"
        f"  --bg: {tokens['bg']};\n"
        f"  --ink: {tokens['ink']};\n"
        f"  --accent: {tokens['accent']};\n"
        f"  --muted: {tokens['muted']};\n"
        f"  --surface: {tokens['surface']};\n"
        f"  --line: {tokens['line']};\n"
        f"  --radius: {tokens['radius']};\n"
        "  color: var(--ink);\n"
        "  background: var(--bg);\n"
        '  font-family: "Segoe UI", system-ui, sans-serif;\n'
        "}"
    )


def _stamp_theme(css: str, theme: ThemeName) -> str:
    block = _root_css(theme)
    if _ROOT_BLOCK.search(css):
        css = _ROOT_BLOCK.sub(block, css, count=1)
    else:
        css = f"{block}\n{css}"
    if theme == "modern" and "box-shadow:" not in css:
        css += "\n.card { box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }\n"
    return css


_BUTTON_TYPE = re.compile(r"<button(?![^>]*\btype\s*=)", re.I)

# LLM overlays often ship a pretty UI with dead clicks / broken eval. Pin a working engine.
_CLICKABLE_CSS = """
button, input, select, textarea, a, [role="button"] {
  pointer-events: auto !important;
}
"""

_KEYPAD_CSS = """
.keypad, .keys, .calc-keys {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 0.45rem !important;
}
.keypad button, .keys button, .calc-keys button, .keypad .btn {
  min-width: 0;
  min-height: 2.6rem;
  cursor: pointer;
}
.btn.eq {
  grid-row: auto !important;
  height: auto !important;
}
"""

_KEYPAD_JS = r"""
(function () {
  function terrariumCompute(raw) {
    var src = String(raw)
      .replace(/\u00d7/g, "*")
      .replace(/\u00f7/g, "/")
      .replace(/\u03c0/g, "(" + Math.PI + ")")
      .replace(/\bsin\(/g, "Math.sin(")
      .replace(/\bcos\(/g, "Math.cos(")
      .replace(/\btan\(/g, "Math.tan(")
      .replace(/\bsqrt\(/g, "Math.sqrt(")
      .replace(/\blog\(/g, "Math.log10(")
      .replace(/\bln\(/g, "Math.log(")
      .replace(/\^/g, "**")
      .replace(/\be\b/g, "(" + Math.E + ")");
    if (/[^0-9+\-*/().,\sA-Za-z_]/.test(src.replace(/Math\./g, ""))) {
      throw new Error("Invalid expression");
    }
    var value = Function('"use strict"; return (' + src + ")")();
    if (typeof value !== "number" || !isFinite(value)) throw new Error("Invalid result");
    return value;
  }
  window.terrariumCompute = terrariumCompute;
  try { evaluateExpression = terrariumCompute; } catch (err) {}
})();
"""

_KEYPAD_CLICK_JS = r"""
(function () {
  var keys = document.querySelector(".keypad") || document.querySelector(".keys") || document.querySelector(".calc-keys");
  if (!keys || keys.dataset.terrariumBound) return;
  keys.dataset.terrariumBound = "1";
  function display() {
    return document.getElementById("calc-input") || document.getElementById("display") || document.getElementById("input") || document.querySelector("input");
  }
  function read(el) { return el.value != null ? String(el.value) : String(el.textContent || ""); }
  function write(el, value) { if ("value" in el) el.value = value; else el.textContent = value; }
  function token(btn) {
    return (btn.getAttribute("data-action") || btn.getAttribute("data-value") || btn.getAttribute("data-key") || (btn.textContent || "")).trim();
  }
  keys.addEventListener("click", function (event) {
    var btn = event.target.closest("button");
    if (!btn || !keys.contains(btn)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var input = display();
    if (!input) return;
    var action = token(btn);
    var insert = { "×": "*", "÷": "/", "π": "π", "√": "sqrt(", "x^y": "^", "xy": "^", "sin": "sin(", "cos": "cos(", "tan": "tan(", "log": "log(", "ln": "ln(" }[action] || action;
    if (action === "clear" || action === "AC" || action === "C") { write(input, "0"); return; }
    if (action === "backspace" || action === "⌫" || action === "←") {
      var cur = read(input);
      write(input, cur.length > 1 ? cur.slice(0, -1) : "0");
      return;
    }
    if (action === "=") {
      try { write(input, String(window.terrariumCompute(read(input)))); }
      catch (err) { write(input, "Error"); }
      return;
    }
    if (insert) {
      var now = read(input);
      write(input, now === "0" ? insert : now + insert);
    }
  }, true);
})();
"""

_FORM_CLICK_JS = r"""
(function () {
  var form = document.getElementById("tool-form");
  if (!form || form.dataset.terrariumBound) return;
  form.dataset.terrariumBound = "1";
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var input = document.getElementById("input");
    var result = document.getElementById("result");
    if (!input || !result || typeof window.terrariumCompute !== "function") return;
    try { result.textContent = String(window.terrariumCompute(input.value)); }
    catch (err) { result.textContent = input.value; }
  });
})();
"""


def _looks_like_keypad(html: str) -> bool:
    lower = html.lower()
    return "keypad" in lower or "calc-keys" in lower


def _finalize_files(files: FileMap, layout: Layout | None = None) -> FileMap:
    """Make overlay FileMaps clickable even when the model ships a pretty-but-broken UI."""
    html = files.get("index.html", "")
    css = files.get("styles.css", "")
    js = files.get("app.js", "")
    css += _CLICKABLE_CSS
    if layout == "split" or "site-nav" in html:
        if ".site-header" not in css:
            css += "\n" + _site_css()
    if _looks_like_keypad(html):
        html = _BUTTON_TYPE.sub('<button type="button"', html)
        css += _KEYPAD_CSS
        if "terrariumCompute" not in js:
            js += "\n" + _KEYPAD_JS
        if "terrariumBound" not in js:
            js += "\n" + _KEYPAD_CLICK_JS
    elif "tool-form" in html and "addEventListener" not in js:
        if "terrariumCompute" not in js:
            js += "\n" + _KEYPAD_JS
        js += "\n" + _FORM_CLICK_JS
    out = dict(files)
    if html:
        out["index.html"] = html
    if css:
        out["styles.css"] = css
    if js:
        out["app.js"] = js
    return out


def _load_kit(relative: str) -> FileMap:
    root = templates_root() / relative
    if not root.is_dir():
        raise CodeGeneratorError(f'Template kit "{relative}" is missing at {root}')
    files: FileMap = {}
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(root).as_posix()
        if not _SAFE_PATH.match(rel):
            continue
        if path.suffix.lower() not in _ALLOWED_SUFFIX and path.name != "README.md":
            continue
        files[rel] = path.read_text(encoding="utf-8")
    if "index.html" not in files:
        raise CodeGeneratorError(f'Template "{relative}" must include index.html')
    return files


def apply_placeholders(files: FileMap, intent: Intent, prompt: str) -> FileMap:
    title = (intent.summary or prompt or "New tool").strip().split("\n")[0][:80] or "New tool"
    summary = (intent.summary or title).strip()[:400]
    prompt_text = prompt.strip()[:800]
    replacements = {
        "{{TITLE}}": html.escape(title, quote=True),
        "{{SUMMARY}}": html.escape(summary, quote=True),
        "{{PROMPT}}": html.escape(prompt_text, quote=True),
        "{{TITLE_JSON}}": json.dumps(title),
        "{{PROMPT_JSON}}": json.dumps(prompt_text),
    }
    return {name: _replace_all(body, replacements) for name, body in files.items()}


def _require_new(job: AgentJob) -> None:
    if job.intent.kind != "new":
        raise CodeGeneratorError(
            "Code Generator rejects kind=modify. The caller must use the Editor agent."
        )


def detect_complexity(job: AgentJob) -> Complexity:
    blob = f"{job.intent.stack} {job.intent.summary} {job.prompt}"
    if job.intent.stack == "fullstack" or _COMPLEX.search(blob):
        return "complex"
    return "basic"


def build_session_plan(job: AgentJob) -> SessionPlan:
    """Simple apps skip the LLM. Complex apps ask NVIDIA/Gemini for a design, then clamp to a layout recipe."""
    _require_new(job)
    complexity = detect_complexity(job)
    stack: Stack = "fullstack" if complexity == "complex" else "react"
    logger.info(
        "Plan %s complexity=%s stack=%s summary=%s",
        job.sessionId,
        complexity,
        stack,
        job.intent.summary[:80],
    )
    heuristic = _heuristic_plan(job, complexity, stack)
    if complexity == "basic":
        logger.info("Plan %s skipped LLM (simple app)", job.sessionId)
        return heuristic
    logger.info("Plan %s calling architecture model", job.sessionId)
    payload = _maybe_llm_plan(job, heuristic)
    if payload:
        logger.info("Plan %s used LLM architecture JSON", job.sessionId)
    else:
        logger.warning("Plan %s LLM missed; using heuristic fullstack plan", job.sessionId)
    return _plan_from_payload(payload, fallback=heuristic) if payload else heuristic


def draft_files(
    job: AgentJob,
    *,
    stack: Stack | None = None,
    layout: Layout | None = None,
    theme: ThemeName | None = None,
) -> FileMap:
    """Live canvas FileMap from a layout recipe, not a product-page kit."""
    _require_new(job)
    _ = stack  # SessionPlan still carries stack; first-time FileMap is always a layout (P2-S5)
    chosen = layout or pick_layout(job)
    files = apply_placeholders(_load_layout(chosen), job.intent, job.prompt)
    files["styles.css"] = _stamp_theme(files["styles.css"], theme or pick_theme(job))
    return files


def generate(job: AgentJob, plan: SessionPlan | None = None) -> AgentResult:
    """Fill a layout recipe from Intent. New apps only. Never talks to Docker."""
    _require_new(job)
    resolved = plan or build_session_plan(job)
    logger.info(
        "Generate %s filling layout=%s theme=%s stack=%s complexity=%s",
        job.sessionId,
        resolved.layout,
        resolved.theme,
        resolved.stack,
        resolved.complexity,
    )
    files = draft_files(
        job, stack=resolved.stack, layout=resolved.layout, theme=resolved.theme
    )
    overlay = _maybe_llm_overlay(job, files, resolved)
    if overlay:
        merged = {**files, **overlay}
        if _is_static_preview(merged):
            files = merged
            logger.info("Generate %s applied LLM overlay files=%s", job.sessionId, list(overlay))
        else:
            logger.warning(
                "Generate %s overlay rejected (needs vanilla HTML/CSS/JS, no CDN); keeping template",
                job.sessionId,
            )
    else:
        logger.warning("Generate %s no LLM overlay; serving filled layout", job.sessionId)
    if "styles.css" in files:
        files["styles.css"] = _stamp_theme(files["styles.css"], resolved.theme)
    files = _finalize_files(files, layout=resolved.layout)
    if not _has_html_document(files.get("index.html", "")):
        raise CodeGeneratorError("Generator output is missing a valid index.html")
    _assert_file_sizes(files)
    return AgentResult(
        files=files,
        commitMessage=f"Generate {resolved.stack} app: {job.intent.summary[:72]}",
    )


def _heuristic_plan(job: AgentJob, complexity: Complexity, stack: Stack) -> SessionPlan:
    summary = (job.intent.summary or job.prompt).strip()[:240]
    layout = pick_layout(job)
    theme = pick_theme(job)
    if layout == "split":
        return SessionPlan(
            complexity=complexity,
            stack=stack,
            screens=("home", "about", "contact"),
            data=("static pages only",),
            files=("index.html", "about.html", "contact.html", "styles.css", "app.js", "js/nav.js"),
            notes=f"Multi-page site ({theme}) for: {summary}",
            layout=layout,
            theme=theme,
        )
    if complexity == "basic":
        return SessionPlan(
            complexity="basic",
            stack="react",
            screens=("main",),
            data=("local note text",),
            files=("index.html", "styles.css", "app.js"),
            notes=f"Simple {layout} layout ({theme}) for: {summary}",
            layout=layout,
            theme=theme,
        )
    return SessionPlan(
        complexity="complex",
        stack="fullstack",
        screens=("main", "list"),
        data=("localStorage item list",),
        files=("index.html", "styles.css", "app.js"),
        notes=f"Static {layout} layout ({theme}) with an in-browser store for: {summary}",
        layout=layout,
        theme=theme,
    )


def _maybe_llm_plan(job: AgentJob, fallback: SessionPlan) -> dict | None:
    from terrarium_agents.llm import complete_json

    if fallback.layout == "split":
        system = (
            "You are Terrarium's architecture step for a static website. "
            "Return JSON only: "
            '{"complexity":"complex","stack":"fullstack","screens":["home","about","contact"],'
            '"data":["static pages only"],'
            '"files":["index.html","about.html","contact.html","styles.css","app.js","js/nav.js"],'
            '"notes":"one paragraph"}. '
            "No npm, no backend, no database server, no Docker. "
            "Screens are HTML pages. Add blog.html only if the prompt asks for a blog."
        )
    else:
        system = (
            "You are Terrarium's architecture step for a static preview app. "
            "Return JSON only: "
            '{"complexity":"complex","stack":"fullstack","screens":["..."],'
            '"data":["in-memory or localStorage only"],'
            '"files":["index.html","styles.css","app.js"],'
            '"notes":"one paragraph"}. '
            "stack must be fullstack. No npm, no backend, no database server, no Docker. "
            "Design screens and local data so a static HTML/CSS/JS kit can implement it."
        )
    return complete_json(
        system=system,
        user=(
            f"summary={job.intent.summary}\n"
            f"prompt={job.prompt}\n"
            f"fallback={json.dumps(fallback.to_payload())}"
        ),
        purpose="plan",
    )


def _plan_from_payload(raw: dict, fallback: SessionPlan) -> SessionPlan:
    screens = _string_tuple(raw.get("screens")) or fallback.screens
    data = _string_tuple(raw.get("data")) or fallback.data
    files = _safe_file_tuple(raw.get("files")) or fallback.files
    notes = str(raw.get("notes") or fallback.notes).strip()[:800]
    return SessionPlan(
        complexity="complex",
        stack="fullstack",
        screens=screens[:12],
        data=data[:12],
        files=files[:16],
        notes=notes or fallback.notes,
        layout=fallback.layout,
        theme=fallback.theme,
    )


def _overlay_rules(plan: SessionPlan) -> str:
    looks = {
        "modern": "contemporary consumer-app UI, airy spacing, soft card shadows, large tap targets",
        "maroon": "warm maroon-on-cream Terrarium look",
        "dark": "dark surfaces and light text, no harsh white panels",
        "light": "clean light UI with a blue accent",
    }
    look = (
        f"Visual look is {plan.theme}: {looks[plan.theme]}. "
        "Honor :root variables (--bg, --ink, --accent, --muted, --surface, --line, --radius). "
        "Do not hardcode theme colors. The preview iframe cannot load unpkg."
    )
    if plan.layout == "split":
        return (
            "Vanilla HTML/CSS/JS only. No React, JSX, Babel, npm, or CDN script tags. "
            "This is a real multi-page website, not a tool shell and not a single-page app. "
            "Return index.html, about.html, contact.html, styles.css, app.js, and js/nav.js. "
            "Add blog.html only if the spec asks for a blog. "
            "Every page uses #root.site, header.site-header, and nav.site-nav with hrefs "
            "(index.html, about.html, contact.html) — never data-target buttons as routes. "
            "Home has section.hero and main.split. Inner pages use main.section. "
            "No 'Terrarium ·' eyebrow. Write real copy for the user's spec. "
            "Contact form uses addEventListener + preventDefault (no server). "
            + look
        )
    return (
        "Vanilla HTML/CSS/JS only. No React, JSX, Babel, npm, or CDN script tags. "
        "Replace the empty starter with the actual working tool. "
        "A calculator needs a keypad (0-9, operators, equals, clear) and a history list — "
        "not a single Go button. A converter needs from/to fields that convert on input. "
        "A game needs a playable board. "
        "app.js must handle clicks with type=button (never submit) and DOM addEventListener. "
        "Put keypad buttons in a .keypad CSS grid (not flex-wrap). "
        "Do not use * { margin:0; padding:0 }. Do not replaceAll(\"e\", ...) — that breaks Math.sin. "
        + look
    )


def _overlay_prompt(job: AgentJob, files: FileMap, plan: SessionPlan) -> tuple[str, str]:
    rules = _overlay_rules(plan)
    if plan.layout == "split":
        system = (
            "You implement a Terrarium static website. Return JSON only: "
            '{"files": {"index.html": "...", "about.html": "...", "contact.html": "...", '
            '"styles.css": "...", "app.js": "...", "js/nav.js": "..."}}. '
            + rules
        )
        chunks = [
            f"theme={plan.theme} layout=split",
            f"summary={job.intent.summary}",
            f"prompt={job.prompt}",
        ]
        for name in ("index.html", "about.html", "contact.html", "styles.css", "app.js", "js/nav.js"):
            body = files.get(name)
            if body:
                chunks.append(f"{name}:\n{body[:3500]}")
        return system, "\n\n".join(chunks)
    if plan.complexity == "complex":
        system = (
            "You implement a Terrarium static app from an architecture plan. "
            "Return JSON only: "
            '{"files": {"index.html": "...", "styles.css": "...", "app.js": "..."}}. '
            + rules
            + " Honor the plan screens and localStorage data."
        )
        user = (
            f"plan={json.dumps(plan.to_payload())}\n"
            f"summary={job.intent.summary}\n"
            f"prompt={job.prompt}\n\n"
            f"index.html:\n{files.get('index.html', '')[:5000]}\n\n"
            f"styles.css:\n{files.get('styles.css', '')[:2500]}\n\n"
            f"app.js:\n{files.get('app.js', '')[:2500]}"
        )
        return system, user
    system = (
        "You customize a Terrarium simple static starter. Return JSON only: "
        '{"files": {"index.html": "...", "styles.css": "optional", "app.js": "optional"}}. '
        + rules
    )
    user = (
        f"stack=react theme={plan.theme} layout={plan.layout}\n"
        f"summary={job.intent.summary}\n"
        f"prompt={job.prompt}\n\n"
        f"Current index.html:\n{files.get('index.html', '')[:5000]}\n\n"
        f"app.js:\n{files.get('app.js', '')[:2500]}"
    )
    return system, user


def _maybe_llm_overlay(job: AgentJob, files: FileMap, plan: SessionPlan) -> FileMap:
    from terrarium_agents.llm import complete_json

    system, user = _overlay_prompt(job, files, plan)
    payload = complete_json(system, user, purpose="codegen")
    if not payload:
        return {}
    raw_files = payload.get("files")
    if not isinstance(raw_files, dict):
        raw_files = {
            name: payload[name]
            for name in (
                "index.html",
                "about.html",
                "contact.html",
                "blog.html",
                "styles.css",
                "app.js",
                "js/nav.js",
            )
            if isinstance(payload.get(name), str)
        }
    overlay: FileMap = {}
    for name, body in raw_files.items():
        if not isinstance(name, str) or not isinstance(body, str):
            continue
        rel = name.replace("\\", "/").lstrip("/")
        if ".." in rel or not _SAFE_PATH.match(rel):
            continue
        suffix = Path(rel).suffix.lower() or (".html" if rel.endswith("html") else "")
        if suffix not in _ALLOWED_SUFFIX:
            continue
        overlay[rel] = body
    return overlay


def _string_tuple(value: object) -> tuple[str, ...]:
    if not isinstance(value, list):
        return ()
    items = [item.strip() for item in value if isinstance(item, str) and item.strip()]
    return tuple(items)


def _safe_file_tuple(value: object) -> tuple[str, ...]:
    names: list[str] = []
    for item in _string_tuple(value):
        rel = item.replace("\\", "/").lstrip("/")
        if ".." in rel or not _SAFE_PATH.match(rel):
            continue
        suffix = Path(rel).suffix.lower()
        if suffix not in _ALLOWED_SUFFIX and rel != "README.md":
            continue
        names.append(rel)
    return tuple(names)


def _replace_all(body: str, replacements: dict[str, str]) -> str:
    for needle, value in replacements.items():
        body = body.replace(needle, value)
    return body


def _has_html_document(body: str) -> bool:
    return "<html" in body.lower()


def _is_static_preview(files: FileMap) -> bool:
    html = files.get("index.html", "")
    if not _has_html_document(html):
        return False
    blob = "\n".join(files.values())
    if _CDN_RE.search(blob):
        return False
    if re.search(r"""src\s*=\s*['"]https?://""", html, re.I):
        return False
    return True


def _assert_file_sizes(files: FileMap) -> None:
    for name, body in files.items():
        if len(body.encode("utf-8")) > _MAX_FILE_BYTES:
            raise CodeGeneratorError(f'Generated file "{name}" exceeds {_MAX_FILE_BYTES} bytes')
