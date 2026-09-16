from __future__ import annotations

import html
import json
import logging
import os
import posixpath
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from terrarium_contracts import AgentJob, AgentResult, BackendStack, FileMap, FrontendStack, Intent, Stack

_SAFE_PATH = re.compile(r"^(?!\.)[a-zA-Z0-9._/-]+$")
_ALLOWED_SUFFIX = {".html", ".css", ".js", ".jsx", ".json", ".md", ".svg", ".txt"}
_ALLOWED_NAMES = {"README.md", ".env.example"}
_RESOLVABLE_IMPORT_SUFFIXES = (".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".svg")
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
_BACKEND_NEEDED_RE = re.compile(
    r"\b(auth|logins?|sign[- ]?up|users?|shared|database|db|backend|server|"
    r"api keys?|secrets?|payments?|email|upload|file processing|multi[- ]?user|"
    r"roles?|permissions?|websocket|real[- ]?time)\b",
    re.I,
)
_CDN_RE = re.compile(
    r"unpkg\.com|cdnjs\.cloudflare|jsdelivr\.net|esm\.sh|skypack\.dev|"
    r"react@\d|react-dom@|babel\.min|text/babel|cdn\.jsdelivr",
    re.I,
)
_ROOT_BLOCK = re.compile(r":root\s*\{[^}]*\}", re.S)
_RELATIVE_IMPORT_RE = re.compile(
    r"""(?:import|export)\s+(?:[^'"()]+?\s+from\s*)?['"](\.{1,2}/[^'"]+)['"]|import\s*\(\s*['"](\.{1,2}/[^'"]+)['"]\s*\)""",
    re.M,
)

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
        "radius": "12px",
    },
    "light": {
        "bg": "#f7f7f8",
        "ink": "#171717",
        "accent": "#1d4ed8",
        "muted": "#525252",
        "surface": "#ffffff",
        "line": "#e5e5e5",
        "radius": "12px",
    },
    "modern": {
        "bg": "#f4f6fb",
        "ink": "#0f172a",
        "accent": "#2563eb",
        "muted": "#64748b",
        "surface": "#ffffff",
        "line": "#e2e8f0",
        "radius": "14px",
    },
    "dark": {
        "bg": "#161314",
        "ink": "#f4ecee",
        "accent": "#e8b4bc",
        "muted": "#c4b4b8",
        "surface": "#221c1e",
        "line": "#3a3032",
        "radius": "12px",
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
    architecture: str = ""
    approach: str = ""
    structure: tuple[str, ...] = ()
    frontend_stack: FrontendStack = "react"
    backend_stack: BackendStack = "none"

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
            "architecture": self.architecture,
            "approach": self.approach,
            "structure": list(self.structure),
            "frontendStack": self.frontend_stack,
            "backendStack": self.backend_stack,
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
    """
    Dynamically choose theme based on app type and context.
    Gemini approach: theme matches the app's purpose/mood.
    """
    blob = f"{job.intent.summary} {job.prompt}".lower()
    
    # Explicit user preference
    tagged = _LOOK_TAG.search(blob)
    if tagged:
        value = (tagged.group(1) or tagged.group(2)).lower()
        if value == "classic":
            return "maroon"
        if value == "modern":
            return "modern"
        return "dark"
    
    # Dark mode keywords
    if re.search(r"\b(dark mode|dark theme|\bdark\b|night mode|black theme)", blob, re.I):
        return "dark"
    
    # Modern tech/productivity apps
    if re.search(r"\b(dashboard|analytics|metrics|admin|saas|crm|modern|tech|productivity)\b", blob, re.I):
        return "modern"
    
    # Professional/business apps
    if re.search(r"\b(business|professional|enterprise|corporate|invoice|timesheet)\b", blob, re.I):
        return "light"
    
    # Creative/fun apps
    if re.search(r"\b(game|fun|playground|creative|art|music|entertainment)\b", blob, re.I):
        return "modern"
    
    # Default to light for most utility apps (calculators, converters, etc.)
    if re.search(r"\b(calculat|convert|timer|tool|utility|helper)\b", blob, re.I):
        return "light"
    
    # Notepad/writing apps - warm but neutral
    if re.search(r"\b(note|write|editor|text|journal|blog)\b", blob, re.I):
        return "light"
    
    # Fallback to light (neutral, professional)
    return "light"


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
        '  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n'
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


_REACT_DEFAULT_IMPORT_RE = re.compile(
    r"^\s*import\s+React(?:\s*,[^\n;]*)?\s+from\s*['\"]react['\"]",
    re.M,
)


def _ensure_react_default_imports(files: FileMap) -> FileMap:
    out = dict(files)
    for path, body in files.items():
        if not path.endswith(".jsx"):
            continue
        if "<" not in body or _REACT_DEFAULT_IMPORT_RE.search(body):
            continue
        out[path] = "import React from 'react';\n" + body
    return out


def _finalize_files(files: FileMap, layout: Layout | None = None) -> FileMap:
    """Make overlay FileMaps clickable even when the model ships a pretty-but-broken UI."""
    html = files.get("index.html", "")
    css = files.get("styles.css", "")
    js = files.get("app.js", "")
    css += _CLICKABLE_CSS
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
    return _ensure_react_default_imports(out)


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
    if resolve_backend_stack(job) != "none" or job.intent.stack == "fullstack" or _COMPLEX.search(blob):
        return "complex"
    return "basic"


def resolve_frontend_stack(job: AgentJob) -> FrontendStack:
    selected = job.frontendStack or job.intent.frontendStack
    return selected if selected in {"vanilla", "react"} else "react"


def resolve_backend_stack(job: AgentJob) -> BackendStack:
    if job.backendStack in {"none", "node-express"}:
        return job.backendStack
    if job.backendNeed == "yes":
        return "node-express"
    if job.backendNeed == "no":
        return "none"
    if job.intent.backendStack in {"none", "node-express"}:
        return job.intent.backendStack
    blob = f"{job.intent.summary} {job.prompt}"
    return "node-express" if _BACKEND_NEEDED_RE.search(blob) else "none"


def build_session_plan(job: AgentJob) -> SessionPlan:
    """Requirements → architecture / approach / structure, then clamp to a layout recipe."""
    from terrarium_agents.llm import agents_mode

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
    if agents_mode() != "live" and complexity == "basic":
        logger.info("Plan %s skipped LLM (stub + simple app)", job.sessionId)
        return heuristic
    logger.info("Plan %s calling architecture model", job.sessionId)
    payload = _maybe_llm_plan(job, heuristic)
    if payload:
        logger.info("Plan %s used LLM architecture JSON", job.sessionId)
        return _plan_from_payload(payload, fallback=heuristic)
    logger.warning("Plan %s LLM missed; using heuristic plan", job.sessionId)
    return heuristic


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
    """Model FileMap only. New apps only. Never talks to Docker. Never serves a layout recipe."""
    from terrarium_agents.llm import agents_mode

    _require_new(job)
    resolved = plan or build_session_plan(job)
    logger.info(
        "Generate %s from model plan layout=%s stack=%s complexity=%s",
        job.sessionId,
        resolved.layout,
        resolved.stack,
        resolved.complexity,
    )
    overlay = _maybe_llm_overlay(job, resolved)
    overlay_error = _static_preview_error(overlay) if overlay else None
    if overlay and overlay_error is None:
        files = overlay
        logger.info("Generate %s used model FileMap files=%s", job.sessionId, list(files))
    elif agents_mode() != "live" or overlay_error is None:
        files = _stub_generated_files(job, resolved)
        if agents_mode() == "live":
            logger.warning(
                "Generate %s using deterministic FileMap fallback because live providers returned no JSON",
                job.sessionId,
            )
        else:
            logger.info("Generate %s stub FileMap (no layout recipe)", job.sessionId)
    else:
        reason = overlay_error or (
            "model JSON did not contain any safe files. Expected "
            '{"files":{"index.html":"...","styles.css":"...","app.js":"..."}}'
        )
        logger.warning("Generate %s rejected model FileMap: %s", job.sessionId, reason)
        raise CodeGeneratorError(
            f"The coding model did not return a runnable FileMap: {reason}. "
            "Not serving a template."
        )
    files = _finalize_files(files)
    if not _has_html_document(_entry_html(files)):
        raise CodeGeneratorError("Generator output is missing a valid index.html")
    final_error = _static_preview_error(files)
    if final_error is not None:
        raise CodeGeneratorError(f"Generator output is not runnable: {final_error}")
    _assert_file_sizes(files)
    return AgentResult(
        files=files,
        commitMessage=f"Generate {resolved.stack} app: {job.intent.summary[:72]}",
    )


def _stub_generated_files(job: AgentJob, plan: SessionPlan) -> FileMap:
    """
    CI/stub only. Not a product template and not shown when agents are live.
    Now generates component-based structure instead of flat 3 files.
    """
    title = html.escape(
        (job.intent.summary or job.prompt or "New tool").strip().split("\n")[0][:80]
        or "New tool",
        quote=True,
    )
    summary = html.escape((job.intent.summary or title).strip()[:400], quote=True)
    raw_title = (job.intent.summary or job.prompt or "New tool").strip().split("\n")[0][:80] or "New tool"
    if plan.frontend_stack == "react" and plan.backend_stack == "node-express":
        return _stub_react_node_files(raw_title, job.prompt, plan)
    if plan.frontend_stack == "react":
        return _stub_react_files(raw_title, job.prompt, plan)
    
    # Base files with component structure
    files: FileMap = {
        "index.html": (
            "<!doctype html>\n<html lang=\"en\">\n<head>\n"
            f"  <meta charset=\"utf-8\"/>\n  <title>{title}</title>\n"
            "  <link rel=\"stylesheet\" href=\"styles.css\"/>\n</head>\n<body>\n"
            f"  <main id=\"app\">\n    <h1>{title}</h1>\n    <p>{summary}</p>\n  </main>\n"
            "  <script src=\"app.js\" type=\"module\"></script>\n</body>\n</html>\n"
        ),
        "styles.css": (
            ":root { --bg: #f7f7f8; --ink: #171717; --accent: #1d4ed8; }\n"
            "body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; "
            "background: var(--bg); color: var(--ink); }\n"
            "main { max-width: 800px; margin: 0 auto; }\n"
        ),
        "app.js": (
            "// Main application entry point\n"
            "console.log('App initialized');\n"
            "document.addEventListener('DOMContentLoaded', function () {\n"
            "  console.log('DOM ready');\n"
            "});\n"
        ),
    }
    
    # Add component files based on plan
    for name in plan.files:
        if name in files:
            continue
        if name.endswith(".html"):
            files[name] = files["index.html"].replace(title, f"{title} - {name}")
        elif name.endswith(".js"):
            component_name = name.replace("components/", "").replace("utils/", "").replace(".js", "")
            files[name] = (
                f"// {component_name} module\n"
                f"export function init{component_name.replace('-', '').title()}() {{\n"
                "  console.log('Component initialized');\n"
                "}\n"
            )
        elif name.endswith(".css"):
            files[name] = f"/* {name} styles */\n"
    
    return files


def _section_from_text(value: str, fallback_body: str) -> dict[str, str]:
    raw = value.strip()
    if " — " in raw:
        heading, body = raw.split(" — ", 1)
    elif " - " in raw:
        heading, body = raw.split(" - ", 1)
    else:
        heading, body = raw, fallback_body
    heading = re.sub(r"^\d+[\).]\s*", "", heading).strip()[:64] or "Feature"
    body = body.strip()[:180] or fallback_body
    return {"title": heading, "body": body}


def _fallback_sections(plan: SessionPlan, prompt: str) -> list[dict[str, str]]:
    defaults_by_layout: dict[Layout, list[str]] = {
        "split": [
            "Hero experience — Strong first impression with the product promise, audience, and primary action.",
            "Featured collection — Curated cards that make the main offering feel browsable and complete.",
            "Detail view — Focused section for deeper information, specs, benefits, and context.",
            "Trust signals — Polished supporting content for credibility, quality, and confidence.",
            "Action flow — Clear next step so the page feels useful instead of decorative.",
            "Responsive polish — Layout adapts cleanly from desktop to mobile.",
        ],
        "list": [
            "Overview — Clear dashboard summary with the most important information first.",
            "Organized items — Scannable rows and cards with useful metadata.",
            "Filters — Quick controls for narrowing and finding content.",
            "Progress — Visual state that shows what needs attention.",
            "Details — Secondary information without cluttering the main view.",
            "Actions — Practical buttons that make the tool interactive.",
        ],
        "form": [
            "Input area — Focused controls for the user's main task.",
            "Live result — Immediate output area that makes the tool feel responsive.",
            "History — Saved recent entries for continuity.",
            "Options — Useful settings without overwhelming the interface.",
        ],
        "board": [
            "Game board — Clear visual play area with strong spacing.",
            "Score panel — Current status, turns, and progress.",
            "Controls — Restart and interaction controls.",
            "Rules — Concise guidance for the user.",
        ],
    }
    source = list(plan.screens) or list(plan.structure) or defaults_by_layout[plan.layout]
    sections = [
        _section_from_text(item, defaults_by_layout[plan.layout][index % len(defaults_by_layout[plan.layout])].split(" — ", 1)[1])
        for index, item in enumerate(source[:6])
    ]
    while len(sections) < min(4, len(defaults_by_layout[plan.layout])):
        sections.append(_section_from_text(defaults_by_layout[plan.layout][len(sections)], "Useful generated section."))
    if not sections:
        sections.append({"title": "Generated experience", "body": prompt[:160] or "A focused app generated from your request."})
    return sections[:6]


def _summary_sentence(plan: SessionPlan, title: str) -> str:
    notes = re.sub(r"\s+", " ", plan.notes or "").strip()
    if notes:
        notes = notes.split("\n", 1)[0].split(". ", 1)[0].strip(". ")
    if not notes or notes.lower().startswith("react "):
        notes = f"A polished, responsive {title.lower()} with prompt-specific sections and working local state."
    return notes[:220]


def _stub_react_files(title: str, prompt: str, plan: SessionPlan | None = None) -> FileMap:
    title_json = json.dumps(title)
    fallback_plan = plan or SessionPlan(
        complexity="basic",
        stack="react",
        screens=(title,),
        data=(),
        files=(),
        notes=prompt[:300],
    )
    sections_json = json.dumps(_fallback_sections(fallback_plan, prompt), indent=2)
    subtitle_json = json.dumps(_summary_sentence(fallback_plan, title))
    eyebrow = {
        "split": "Modern website",
        "list": "Interactive workspace",
        "form": "Smart web tool",
        "board": "Playable experience",
    }[fallback_plan.layout]
    eyebrow_json = json.dumps(eyebrow)
    return {
        "package.json": json.dumps(
            {
                "name": "terrarium-react-app",
                "private": True,
                "version": "0.0.0",
                "type": "module",
                "scripts": {"dev": "vite --host 0.0.0.0", "build": "vite build", "preview": "vite preview --host 0.0.0.0"},
                "dependencies": {"@vitejs/plugin-react": "^latest", "vite": "^latest", "react": "^latest", "react-dom": "^latest"},
                "devDependencies": {},
            },
            indent=2,
        ),
        "index.html": (
            "<!doctype html>\n<html lang=\"en\">\n<head>\n"
            "  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n"
            f"  <title>{html.escape(title)}</title>\n</head>\n<body>\n"
            "  <div id=\"root\"></div>\n  <script type=\"module\" src=\"/src/main.jsx\"></script>\n"
            "</body>\n</html>\n"
        ),
        "src/main.jsx": (
            "import React from 'react';\n"
            "import { createRoot } from 'react-dom/client';\n"
            "import App from './App.jsx';\n"
            "import './styles/global.css';\n\n"
            "createRoot(document.getElementById('root')).render(<App />);\n"
        ),
        "src/App.jsx": (
            "import { AppShell } from './components/AppShell.jsx';\n"
            "import { useLocalState } from './hooks/useLocalState.js';\n\n"
            f"const initialSections = {sections_json};\n\n"
            "export default function App() {\n"
            "  const [sections, setSections] = useLocalState('terrarium-sections', initialSections);\n"
            f"  return <AppShell title={title_json} eyebrow={eyebrow_json} subtitle={subtitle_json} sections={{sections}} onSectionsChange={{setSections}} />;\n"
            "}\n"
        ),
        "src/components/AppShell.jsx": (
            "import { useMemo, useState } from 'react';\n"
            "import { Hero } from './Hero.jsx';\n"
            "import { FeatureGrid } from './FeatureGrid.jsx';\n"
            "import { DetailPanel } from './DetailPanel.jsx';\n"
            "import { ContactForm } from './ContactForm.jsx';\n"
            "import { Toolbar } from './Toolbar.jsx';\n\n"
            "export function AppShell({ title, eyebrow, subtitle, sections, onSectionsChange }) {\n"
            "  const [activeIndex, setActiveIndex] = useState(0);\n"
            "  const [mode, setMode] = useState('overview');\n"
            "  const activeSection = sections[activeIndex] ?? sections[0];\n"
            "  const metrics = useMemo(() => [sections.length, activeIndex + 1, mode === 'contact' ? 'Contact' : 'Explore'], [sections.length, activeIndex, mode]);\n"
            "  function addSection() {\n"
            "    const next = { title: `Custom idea ${sections.length + 1}`, body: 'New interactive section added during the live preview.' };\n"
            "    onSectionsChange([...sections, next]);\n"
            "    setActiveIndex(sections.length);\n"
            "  }\n"
            "  return (\n"
            "    <main className=\"app-shell\">\n"
            "      <Toolbar mode={mode} onModeChange={setMode} onAdd={addSection} />\n"
            "      <Hero title={title} eyebrow={eyebrow} subtitle={subtitle} metrics={metrics} onExplore={() => setMode('overview')} onContact={() => setMode('contact')} />\n"
            "      {mode === 'contact' ? (\n"
            "        <ContactForm title={title} />\n"
            "      ) : (\n"
            "        <>\n"
            "          <FeatureGrid sections={sections} activeIndex={activeIndex} onSelect={setActiveIndex} />\n"
            "          <DetailPanel section={activeSection} index={activeIndex} total={sections.length} onPrev={() => setActiveIndex((activeIndex - 1 + sections.length) % sections.length)} onNext={() => setActiveIndex((activeIndex + 1) % sections.length)} />\n"
            "        </>\n"
            "      )}\n"
            "    </main>\n"
            "  );\n"
            "}\n"
        ),
        "src/components/Toolbar.jsx": (
            "export function Toolbar({ mode, onModeChange, onAdd }) {\n"
            "  return <header className=\"toolbar\"><strong>Terrarium App</strong><nav><button type=\"button\" className={mode === 'overview' ? 'active' : ''} onClick={() => onModeChange('overview')}>Overview</button><button type=\"button\" className={mode === 'contact' ? 'active' : ''} onClick={() => onModeChange('contact')}>Contact</button><button type=\"button\" onClick={onAdd}>Add section</button></nav></header>;\n"
            "}\n"
        ),
        "src/components/Hero.jsx": (
            "export function Hero({ title, eyebrow, subtitle, metrics, onExplore, onContact }) {\n"
            "  return <section className=\"hero\"><p>{eyebrow}</p><h1>{title}</h1><span>{subtitle}</span><div className=\"hero-actions\"><button type=\"button\" onClick={onExplore}>Explore sections</button><button type=\"button\" className=\"ghost-button\" onClick={onContact}>Open contact</button></div><div className=\"metrics\">{metrics.map((metric, index) => <strong key={index}>{metric}<small>{index === 0 ? 'sections' : index === 1 ? 'active' : 'mode'}</small></strong>)}</div></section>;\n"
            "}\n"
        ),
        "src/components/FeatureGrid.jsx": (
            "export function FeatureGrid({ sections, activeIndex, onSelect }) {\n"
            "  return <section className=\"card-grid\" aria-label=\"Interactive sections\">{sections.map((section, index) => <button type=\"button\" className={`card ${activeIndex === index ? 'selected' : ''}`} key={`${section.title}-${index}`} onClick={() => onSelect(index)}><span>{String(index + 1).padStart(2, '0')}</span><h2>{section.title}</h2><p>{section.body}</p></button>)}</section>;\n"
            "}\n"
        ),
        "src/components/DetailPanel.jsx": (
            "export function DetailPanel({ section, index, total, onPrev, onNext }) {\n"
            "  if (!section) return null;\n"
            "  return <section className=\"detail-panel\"><div><p>Selected section {index + 1} of {total}</p><h2>{section.title}</h2><span>{section.body}</span></div><div className=\"panel-actions\"><button type=\"button\" className=\"ghost-button\" onClick={onPrev}>Previous</button><button type=\"button\" onClick={onNext}>Next section</button></div></section>;\n"
            "}\n"
        ),
        "src/components/ContactForm.jsx": (
            "import { useState } from 'react';\n\n"
            "export function ContactForm({ title }) {\n"
            "  const [name, setName] = useState('');\n"
            "  const [message, setMessage] = useState('');\n"
            "  const [sent, setSent] = useState(false);\n"
            "  function submit(event) { event.preventDefault(); setSent(true); }\n"
            "  return <section className=\"contact-panel\"><form onSubmit={submit}><p>Interactive contact flow</p><h2>Ask about {title}</h2><label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder=\"Your name\" /></label><label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder=\"What should this app help with?\" /></label><button type=\"submit\">Send preview message</button>{sent ? <strong className=\"success\">Thanks{name ? `, ${name}` : ''}. This preview captured your message.</strong> : null}</form></section>;\n"
            "}\n"
        ),
        "src/hooks/useLocalState.js": (
            "import { useEffect, useState } from 'react';\n\n"
            "export function useLocalState(key, initialValue) {\n"
            "  const [value, setValue] = useState(() => {\n"
            "    try { return JSON.parse(localStorage.getItem(key)) ?? initialValue; }\n"
            "    catch (error) { console.error('Could not read local state', { key, error }); return initialValue; }\n"
            "  });\n"
            "  useEffect(() => {\n"
            "    try { localStorage.setItem(key, JSON.stringify(value)); }\n"
            "    catch (error) { console.error('Could not save local state', { key, error }); }\n"
            "  }, [key, value]);\n"
            "  return [value, setValue];\n"
            "}\n"
        ),
        "src/utils/helpers.js": "export function clampText(value, max = 120) { return String(value || '').slice(0, max); }\n",
        "src/styles/global.css": (
            ":root { font-family: system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; color: #101827; background: #f7f8fa; }\n"
            "* { box-sizing: border-box; }\nbody { margin: 0; }\n"
            "body { background: linear-gradient(135deg, #f8fafc, #eef1f5 52%, #f7f8fa); }\n"
            ".app-shell { min-height: 100vh; padding: clamp(24px, 5vw, 60px); max-width: 1180px; margin: 0 auto; }\n"
            ".toolbar { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 32px; color: #475569; }\n"
            ".toolbar strong { letter-spacing: .08em; text-transform: uppercase; font-size: 12px; }\n"
            ".toolbar nav, .hero-actions, .panel-actions { display: flex; gap: 10px; flex-wrap: wrap; }\n"
            "button { border: 0; border-radius: 10px; background: #2563eb; color: white; padding: 12px 18px; font-weight: 750; cursor: pointer; box-shadow: 0 10px 22px rgba(37,99,235,.18); transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }\n"
            "button:hover { transform: translateY(-2px); box-shadow: 0 18px 32px rgba(37,99,235,.28); }\n"
            "button.active, button.selected { background: #0f172a; }\n"
            ".ghost-button { background: white; color: #1d4ed8; border: 1px solid #dbeafe; box-shadow: none; }\n"
            ".hero { display: grid; gap: 16px; margin-bottom: 32px; padding: clamp(28px, 5vw, 56px); border-radius: 18px; background: rgba(255,255,255,.88); border: 1px solid rgba(148,163,184,.22); box-shadow: 0 20px 50px rgba(15,23,42,.09); }\n"
            ".hero p { margin: 0; color: #2563eb; font-size: 12px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }\n"
            ".hero h1 { max-width: 900px; margin: 0; font-size: clamp(32px, 5vw, 54px); line-height: 1.04; letter-spacing: -.045em; text-wrap: balance; }\n"
            ".hero span { max-width: 760px; color: #475569; font-size: clamp(15px, 1.7vw, 18px); line-height: 1.65; }\n"
            ".metrics { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap: 12px; margin-top: 10px; }\n"
            ".metrics strong { padding: 14px; border-radius: 12px; background: rgba(255,255,255,.72); font-size: 22px; }\n"
            ".metrics small { display: block; margin-top: 4px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }\n"
            ".card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }\n"
            ".card { display: block; text-align: left; color: #101827; min-height: 220px; background: rgba(255,255,255,.9); border: 1px solid rgba(148,163,184,.24); border-radius: 16px; padding: 22px; box-shadow: 0 14px 34px rgba(15, 23, 42, .07); }\n"
            ".card.selected { outline: 3px solid rgba(37,99,235,.16); background: linear-gradient(135deg, white, #eff6ff); }\n"
            ".card span { color: #94a3b8; font-size: 12px; font-weight: 900; letter-spacing: .1em; }\n"
            ".card h2 { margin: 22px 0 10px; font-size: 22px; line-height: 1.1; letter-spacing: -.03em; }\n"
            ".card p { color: #475569; line-height: 1.7; margin: 0; }\n"
            ".detail-panel, .contact-panel { margin-top: 22px; padding: clamp(24px, 4vw, 40px); border-radius: 18px; background: #0f172a; color: white; box-shadow: 0 20px 48px rgba(15,23,42,.16); }\n"
            ".detail-panel { display: flex; justify-content: space-between; gap: 24px; align-items: end; }\n"
            ".detail-panel p, .contact-panel p { margin: 0 0 8px; color: #93c5fd; text-transform: uppercase; font-size: 12px; font-weight: 900; letter-spacing: .1em; }\n"
            ".detail-panel h2, .contact-panel h2 { margin: 0 0 10px; font-size: clamp(26px, 4vw, 44px); letter-spacing: -.04em; }\n"
            ".detail-panel span { color: #cbd5e1; line-height: 1.75; max-width: 640px; display: block; }\n"
            "form { display: grid; gap: 16px; max-width: 720px; }\n"
            "label { display: grid; gap: 8px; color: #cbd5e1; font-weight: 800; }\n"
            "input, textarea { width: 100%; border: 1px solid #334155; border-radius: 10px; padding: 14px 16px; background: #1e293b; color: white; font: inherit; }\n"
            "textarea { min-height: 120px; resize: vertical; }\n"
            ".success { display: block; color: #86efac; }\n"
            "@media (max-width: 720px) { .toolbar, .detail-panel { align-items: flex-start; flex-direction: column; } .metrics { grid-template-columns: 1fr; } }\n"
        ),
        "README.md": f"# {title}\n\nGenerated as a React/Vite frontend-only project.\n",
    }


def _stub_react_node_files(title: str, prompt: str, plan: SessionPlan | None = None) -> FileMap:
    files = _stub_react_files(title, prompt, plan)
    frontend = {
        ("frontend/" + path if path != "package.json" else "frontend/package.json"): body
        for path, body in files.items()
        if path != "README.md"
    }
    frontend["package.json"] = json.dumps(
        {
            "name": "terrarium-fullstack-app",
            "private": True,
            "version": "0.0.0",
            "type": "module",
            "scripts": {"dev": "concurrently \"npm --prefix backend run dev\" \"npm --prefix frontend run dev\""},
            "dependencies": {"concurrently": "^latest"},
        },
        indent=2,
    )
    frontend.update(
        {
            "backend/package.json": json.dumps(
                {
                    "name": "terrarium-api",
                    "private": True,
                    "version": "0.0.0",
                    "type": "module",
                    "scripts": {"dev": "node src/server.js"},
                    "dependencies": {"express": "^latest", "cors": "^latest", "dotenv": "^latest"},
                },
                indent=2,
            ),
            "backend/src/server.js": (
                "import express from 'express';\nimport cors from 'cors';\nimport { itemsRouter } from './routes/items.js';\nimport { errorHandler } from './middleware/errorHandler.js';\n\n"
                "const app = express();\napp.use(cors());\napp.use(express.json());\napp.use('/api/items', itemsRouter);\napp.use(errorHandler);\n"
                "const port = process.env.PORT || 3000;\napp.listen(port, '0.0.0.0', () => console.log(`API running on ${port}`));\n"
            ),
            "backend/src/routes/items.js": "import { Router } from 'express';\nimport { listItems, createItem } from '../controllers/itemsController.js';\nexport const itemsRouter = Router();\nitemsRouter.get('/', listItems);\nitemsRouter.post('/', createItem);\n",
            "backend/src/controllers/itemsController.js": "import { addItem, getItems } from '../models/itemStore.js';\nexport function listItems(_req, res) { res.json({ items: getItems() }); }\nexport function createItem(req, res) { res.status(201).json({ item: addItem(req.body || {}) }); }\n",
            "backend/src/models/itemStore.js": "const items = [];\nexport function getItems() { return items; }\nexport function addItem(input) { const item = { id: crypto.randomUUID(), title: String(input.title || 'Untitled') }; items.push(item); return item; }\n",
            "backend/src/middleware/errorHandler.js": "export function errorHandler(error, _req, res, _next) { console.error('API error', error); res.status(500).json({ error: 'Internal server error' }); }\n",
            "backend/src/config/env.js": "export const env = { port: process.env.PORT || '3000' };\n",
            "backend/.env.example": "PORT=3000\n",
            "frontend/vite.config.js": (
                "import { defineConfig } from 'vite';\n"
                "import react from '@vitejs/plugin-react';\n\n"
                "export default defineConfig({\n"
                "  plugins: [react()],\n"
                "  server: { host: '0.0.0.0', proxy: { '/api': 'http://127.0.0.1:3000' } },\n"
                "});\n"
            ),
            "shared/constants.js": "export const API_BASE = '/api';\n",
            "README.md": f"# {title}\n\nGenerated as a React/Vite frontend with Node/Express backend.\n",
        }
    )
    return frontend


def _heuristic_plan(job: AgentJob, complexity: Complexity, stack: Stack) -> SessionPlan:
    summary = (job.intent.summary or job.prompt).strip()[:240]
    layout = pick_layout(job)
    theme = pick_theme(job)
    frontend_stack = resolve_frontend_stack(job)
    backend_stack = resolve_backend_stack(job)
    if backend_stack != "none":
        return SessionPlan(
            complexity="complex",
            stack="fullstack",
            screens=("main", "api"),
            data=("server state and API routes",),
            files=(
                "package.json",
                "frontend/package.json",
                "frontend/vite.config.js",
                "frontend/index.html",
                "frontend/src/main.jsx",
                "frontend/src/App.jsx",
                "frontend/src/components/AppShell.jsx",
                "frontend/src/hooks/useApi.js",
                "frontend/src/styles/global.css",
                "backend/package.json",
                "backend/src/server.js",
                "backend/src/routes/items.js",
                "backend/src/controllers/itemsController.js",
                "backend/src/models/itemStore.js",
                "backend/src/middleware/errorHandler.js",
                "backend/src/config/env.js",
                "backend/.env.example",
                "shared/constants.js",
                "README.md",
            ),
            notes=f"React/Vite frontend with Node/Express backend ({theme}) for: {summary}",
            layout=layout,
            theme=theme,
            frontend_stack=frontend_stack,
            backend_stack=backend_stack,
        )

    if frontend_stack == "react":
        return SessionPlan(
            complexity=complexity,
            stack="react",
            screens=("main",),
            data=("localStorage or in-memory client state",),
            files=(
                "package.json",
                "index.html",
                "src/main.jsx",
                "src/App.jsx",
                "src/components/AppShell.jsx",
                "src/components/Toolbar.jsx",
                "src/hooks/useLocalState.js",
                "src/utils/helpers.js",
                "src/styles/global.css",
                "README.md",
            ),
            notes=f"React/Vite frontend-only project ({theme}) for: {summary}",
            layout=layout,
            theme=theme,
            frontend_stack=frontend_stack,
            backend_stack=backend_stack,
        )
    
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
            frontend_stack=frontend_stack,
            backend_stack=backend_stack,
        )
    
    # Component-based structure for better organization (Gemini approach)
    if complexity == "basic":
        # Suggest 6-10 files for basic apps instead of just 3
        if layout == "form":
            suggested_files = (
                "index.html", "styles.css", "app.js",
                "components/input-area.js", "components/output-area.js",
                "utils/calculator.js", "utils/storage.js"
            )
        elif layout == "list":
            suggested_files = (
                "index.html", "styles.css", "app.js",
                "components/list-item.js", "components/list-container.js",
                "components/add-form.js", "utils/storage.js", "utils/helpers.js"
            )
        else:  # board or default
            suggested_files = (
                "index.html", "styles.css", "app.js",
                "components/main-component.js", "components/controls.js",
                "utils/helpers.js"
            )
        
        return SessionPlan(
            complexity="basic",
            stack="react",
            screens=("main",),
            data=("localStorage",),
            files=suggested_files,
            notes=f"Component-based {layout} layout ({theme}) for: {summary}",
            layout=layout,
            theme=theme,
            frontend_stack=frontend_stack,
            backend_stack=backend_stack,
        )
    
    # Complex apps get even more files
    return SessionPlan(
        complexity="complex",
        stack="fullstack",
        screens=("main", "list", "detail"),
        data=("localStorage with structured data",),
        files=(
            "index.html", "styles.css", "app.js",
            "components/header.js", "components/sidebar.js",
            "components/main-content.js", "components/item.js",
            "utils/storage.js", "utils/helpers.js", "utils/validators.js"
        ),
        notes=f"Component-rich {layout} layout ({theme}) with structured state for: {summary}",
        layout=layout,
        theme=theme,
        frontend_stack=frontend_stack,
        backend_stack=backend_stack,
    )


def _maybe_llm_plan(job: AgentJob, fallback: SessionPlan) -> dict | None:
    from terrarium_agents.llm import complete_json

    system = (
        "You are Terrarium's architecture step. Do not write application files yet. "
        "From the requirements, decide architecture, technical approach, module structure, "
        "and the stack selected by the user. "
        "React means Vite React files. Backend means Node + Express files. "
        "Do not add a backend unless backendStack is node-express. "
        "Do not propose CDNs, Tailwind CDN, remote scripts, API keys, or unavailable packages. "
        "Plan realistic domain-specific screens and seed data; do not preserve clarification questions as app content. "
        "Return JSON only: "
        '{"complexity":"basic"|"complex","stack":"react"|"fullstack",'
        '"architecture":"2-4 sentences","approach":"2-4 sentences",'
        '"structure":["path — role", "..."],'
        '"screens":["..."],"data":["state/storage/API needs"],'
        '"files":["package.json","index.html","src/main.jsx"],'
        '"notes":"one paragraph"}. '
        "Use the fallback files when they match the stack. "
        f"Layout hint is {fallback.layout}; keep website pages as real HTML files if layout is split."
    )
    return complete_json(
        system=system,
        user=(
            f"requirements={job.prompt}\n"
            f"summary={job.intent.summary}\n"
            f"frontendStack={fallback.frontend_stack}\n"
            f"backendStack={fallback.backend_stack}\n"
            f"fallback={json.dumps(fallback.to_payload())}"
        ),
        purpose="plan",
    )


def _plan_from_payload(raw: dict, fallback: SessionPlan) -> SessionPlan:
    screens = _string_tuple(raw.get("screens")) or fallback.screens
    data = _string_tuple(raw.get("data")) or fallback.data
    files = _safe_file_tuple(raw.get("files")) or fallback.files
    notes = str(raw.get("notes") or fallback.notes).strip()[:800]
    architecture = str(raw.get("architecture") or "").strip()[:800]
    approach = str(raw.get("approach") or "").strip()[:800]
    structure = _string_tuple(raw.get("structure"))
    complexity: Complexity = (
        "complex" if str(raw.get("complexity") or fallback.complexity) == "complex" else fallback.complexity
    )
    stack: Stack = fallback.stack
    if raw.get("stack") in {"react", "fullstack"}:
        stack = raw["stack"]
    return SessionPlan(
        complexity=complexity,
        stack=stack,
        screens=screens[:12],
        data=data[:12],
        files=files[:16],
        notes=notes or fallback.notes,
        layout=fallback.layout,
        theme=fallback.theme,
        architecture=architecture,
        approach=approach,
        structure=structure[:16],
        frontend_stack=fallback.frontend_stack,
        backend_stack=fallback.backend_stack,
    )


def _overlay_prompt(job: AgentJob, plan: SessionPlan) -> tuple[str, str]:
    """
    Enhanced prompt following Gemini's approach:
    - Component-based architecture
    - 8-15 files with proper folder structure
    - Organized code with utils/, components/, etc.
    """
    if plan.frontend_stack == "react":
        stack_rules = (
            "## Stack Requirements:\n"
            "- Generate a real Vite React project.\n"
            "- Use React components, hooks, and CSS files under src/.\n"
            "- Include package.json with scripts: dev, build, preview.\n"
            "- Allowed frontend packages only: react, react-dom, vite, @vitejs/plugin-react, react-router-dom, lucide-react.\n"
            "- Do not import any other third-party package.\n"
            "- Frontend entry must be index.html -> src/main.jsx -> src/App.jsx.\n"
        )
        if plan.backend_stack == "node-express":
            stack_rules += (
                "- Include frontend/ and backend/ package.json files.\n"
                "- Backend must be Node + Express with routes, controllers, models, middleware, config, and .env.example.\n"
                "- Frontend API calls must target relative /api paths so the sandbox proxy can route them.\n"
                "- Do not put API keys or secrets in frontend code.\n"
            )
        else:
            stack_rules += "- Do not include a backend folder. Use localStorage for client-only persistence.\n"
    else:
        stack_rules = (
            "## Stack Requirements:\n"
            "- Generate vanilla HTML/CSS/JS that runs in a static nginx iframe.\n"
            "- NO React JSX, NO Babel, NO npm, NO CDN links.\n"
        )

    system = (
        "You are Terrarium's Code Generator creating production-ready applications. "
        "Generate a well-organized, component-based app with proper file structure. "
        "The result must look like a complete custom app for the user's exact prompt, not a scaffold.\n\n"
        f"{stack_rules}\n"
        
        "## Product Quality Bar:\n"
        "- Build the actual requested product experience with domain-specific content, labels, actions, and data.\n"
        "- Never leak clarification questions, raw chat transcripts, or planning prose into the UI.\n"
        "- Do not use generic copy like New item, Generated app, Edit this content, Feature 1, or Placeholder.\n"
        "- The app must be visibly interactive: buttons, tabs, filters, forms, cards, navigation, or controls must change state in the UI.\n"
        "- If the prompt is a website, create a polished landing/page experience with hero, navigation, sections, cards, CTA, and responsive layout. Website cards/sections must be selectable or navigable, not static blocks.\n"
        "- If the prompt is a shop/marketplace, include realistic products, category filters, detail states, cart behavior, totals, and checkout/confirmation flow.\n"
        "- If the prompt is a portfolio, include projects, skills, experience, about/contact sections, and strong visual hierarchy.\n"
        "- If the prompt is a tool, include the real inputs, computed outputs, validation, history, reset/export actions where relevant.\n\n"
        
        "## File Organization (CRITICAL - Follow Gemini's Approach):\n"
        "Create files with clear separation of concerns based on the plan files list:\n"
        "- Entry/config files first\n"
        "- Then shared utilities\n"
        "- Then components/hooks/routes/controllers\n"
        "- Then styles and README\n"
        "- Each component should be 50-150 lines\n\n"
        
        "## Examples of Good File Structure:\n"
        "React Notepad: package.json, index.html, src/main.jsx, src/App.jsx, "
        "src/components/Toolbar.jsx, src/components/Editor.jsx, src/hooks/useLocalState.js, "
        "src/styles/global.css, README.md\n\n"
        
        "React + Node app: package.json, frontend/package.json, frontend/src/App.jsx, "
        "backend/package.json, backend/src/server.js, backend/src/routes/items.js, "
        "backend/src/controllers/itemsController.js, backend/src/models/itemStore.js, shared/constants.js\n\n"
        
        "## Technical Requirements:\n"
        "- No CDN links or remote script src.\n"
        "- All code self-contained in the files object.\n"
        "- Every interactive control must work.\n"
        "- Use React state/hooks for UI interactions such as active tabs, selected cards, filters, modal/detail panels, cart state, form submission, theme toggles, or calculations.\n"
        "- Avoid dead anchors. Use buttons or React Router links that render visible state changes.\n"
        "- localStorage is acceptable only for frontend-only persistence.\n\n"
        
        "## Code Quality:\n"
        "- NO placeholder text (no lorem ipsum, no TODO comments)\n"
        "- Every control must work (no dead buttons)\n"
        "- Real functionality, not mock UI\n"
        "- Clean, readable code with comments\n"
        "- Proper error handling\n\n"
        
        "## Response Format:\n"
        'Return JSON only: {"files": {"path": "content", ...}}\n'
        "Include ALL files mentioned above. Each component gets its own file.\n\n"
        
        "## Styling:\n"
        "- Use CSS custom properties from the plan theme\n"
        "- Use the legal Apple-style system stack: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif. Do not import or embed SF Pro files.\n"
        "- Keep headings balanced and responsive; avoid huge hero titles that wrap every 1-2 words.\n"
        "- Use refined radii: 8-12px for buttons/inputs, 14-18px for cards/panels. Avoid pill corners unless the element is a tiny status chip.\n"
        "- Use strong spacing, visual rhythm, cards, states, subtle shadows, hover/focus styles, and responsive grids\n"
        "- Mobile-responsive (works on phone/tablet/desktop)\n"
        "- Modern, clean UI with proper spacing\n"
        "- Accessibility: proper labels, ARIA when needed\n"
    )
    
    user = (
        f"Requirements: {job.prompt}\n\n"
        f"Summary: {job.intent.summary}\n\n"
        f"Architecture Plan:\n{json.dumps(plan.to_payload(), indent=2)}\n\n"
        "Generate the complete application following the exact stack and file structure above."
    )
    return system, user


def _maybe_llm_overlay(job: AgentJob, plan: SessionPlan) -> FileMap:
    from terrarium_agents.llm import complete_json, nvidia_api_key

    system, user = _overlay_prompt(job, plan)
    payload = complete_json(system, user, purpose="codegen", nvidia_first=bool(nvidia_api_key()))
    if not payload:
        logger.warning("Codegen overlay %s returned no parseable JSON payload", job.sessionId)
        return {}
    raw_files = payload.get("files")
    payload_keys = sorted(str(key) for key in payload.keys())
    logger.info("Codegen overlay %s JSON keys=%s", job.sessionId, payload_keys[:20])
    if not isinstance(raw_files, dict):
        logger.warning(
            "Codegen overlay %s missing files object; trying top-level file keys",
            job.sessionId,
        )
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
    skipped: list[str] = []
    for name, value in raw_files.items():
        body = _coerce_file_body(value)
        if not isinstance(name, str) or body is None:
            skipped.append(f"{name!r}: non-string path or body")
            continue
        rel = name.replace("\\", "/").lstrip("/")
        if ".." in rel or not _SAFE_PATH.match(rel):
            skipped.append(f"{name}: unsafe path")
            continue
        suffix = Path(rel).suffix.lower() or (".html" if rel.endswith("html") else "")
        if suffix not in _ALLOWED_SUFFIX and Path(rel).name not in _ALLOWED_NAMES:
            skipped.append(f"{name}: unsupported suffix")
            continue
        overlay[rel] = body
    if skipped:
        logger.warning(
            "Codegen overlay %s skipped files=%s",
            job.sessionId,
            skipped[:12],
        )
    if not overlay:
        logger.warning(
            "Codegen overlay %s has no safe file entries after sanitizing keys=%s",
            job.sessionId,
            payload_keys[:20],
        )
    return overlay


def _coerce_file_body(value: object) -> str | None:
    if isinstance(value, str):
        return value
    if not isinstance(value, dict):
        return None
    for key in ("content", "body", "source", "code", "text"):
        body = value.get(key)
        if isinstance(body, str):
            return body
    if len(value) == 1:
        only = next(iter(value.values()))
        if isinstance(only, str):
            return only
    return None


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
        if suffix not in _ALLOWED_SUFFIX and Path(rel).name not in _ALLOWED_NAMES:
            continue
        names.append(rel)
    return tuple(names)


def _replace_all(body: str, replacements: dict[str, str]) -> str:
    for needle, value in replacements.items():
        body = body.replace(needle, value)
    return body


def _has_html_document(body: str) -> bool:
    return "<html" in body.lower()


def _entry_html(files: FileMap) -> str:
    return files.get("index.html") or files.get("frontend/index.html") or ""


def _is_static_preview(files: FileMap) -> bool:
    return _static_preview_error(files) is None


def _static_preview_error(files: FileMap) -> str | None:
    html = _entry_html(files)
    if not _has_html_document(html):
        return f"missing index.html HTML document; files={sorted(files.keys())}"
    blob = "\n".join(files.values())
    if _CDN_RE.search(blob):
        return "uses a CDN or external package reference, which cannot run in the static sandbox"
    if re.search(r"""src\s*=\s*['"]https?://""", html, re.I):
        return "index.html references an external script URL"
    missing_import = _missing_relative_import(files)
    if missing_import:
        return missing_import
    return None


def _missing_relative_import(files: FileMap) -> str | None:
    module_paths = tuple(
        path
        for path in files
        if Path(path).suffix.lower() in {".js", ".jsx", ".ts", ".tsx"}
    )
    for path in module_paths:
        for match in _RELATIVE_IMPORT_RE.finditer(files[path]):
            spec = match.group(1) or match.group(2) or ""
            if not _resolve_relative_import(path, spec, files):
                return f"{path} imports missing module {spec}"
    return None


def _resolve_relative_import(source_path: str, specifier: str, files: FileMap) -> str | None:
    source_dir = posixpath.dirname(source_path.replace("\\", "/"))
    target = posixpath.normpath(posixpath.join(source_dir, specifier))
    if target.startswith("../"):
        return None
    if target in files:
        return target
    target_suffix = Path(target).suffix.lower()
    candidates = [target] if target_suffix else []
    if not target_suffix:
        candidates.extend(f"{target}{suffix}" for suffix in _RESOLVABLE_IMPORT_SUFFIXES)
        candidates.extend(f"{target}/index{suffix}" for suffix in _RESOLVABLE_IMPORT_SUFFIXES)
    for candidate in candidates:
        if candidate in files:
            return candidate
    return None


def _assert_file_sizes(files: FileMap) -> None:
    for name, body in files.items():
        if len(body.encode("utf-8")) > _MAX_FILE_BYTES:
            raise CodeGeneratorError(f'Generated file "{name}" exceeds {_MAX_FILE_BYTES} bytes')
