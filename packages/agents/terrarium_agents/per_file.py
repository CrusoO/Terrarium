"""Per-file codegen. Off unless TERRARIUM_PER_FILE_CODEGEN=1.

The monolithic tagged FileMap stays the default. This module builds one app
from a contract: deterministic types, mock data, hooks, tokens, and CSS, then
one model call per leaf and page. A shared gate limits in-flight Bedrock calls.
"""

from __future__ import annotations

import json
import logging
import os
import re
import threading
from pathlib import Path
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field

from terrarium_agents.contract_v2 import (
    SPECS,
    AppSpec,
    Component,
    Contract,
    Mismatch,
    build_contract,
    css_problems,
    deterministic_files,
    file_is_closed,
    file_task,
    find_mismatches,
    lock_scaffold,
    mismatch_rate,
    missing_imports,
    normalize_imports,
    shared_prefix,
    spec_for_prompt,
    strip_page_chrome,
    token_cap,
)


class UnsupportedBlueprint(RuntimeError):
    def __init__(self, mapper: dict) -> None:
        super().__init__(f"unsupported blueprint: {mapper.get('archetype', 'unknown')}")
        self.mapper = mapper


class BlueprintUnavailable(RuntimeError):
    """The blueprint model did not answer. The app itself is not unsupported."""


def resolve_prompt_spec(prompt: str, *, live: bool) -> tuple[AppSpec, dict, list[dict]]:
    """Resolve a prompt without ever presenting the generic Item scaffold live."""
    from terrarium_agents.canary import SUPPORTED_ARCHETYPES, classify
    from terrarium_agents.contract_v2 import map_prompt

    mapped = map_prompt(prompt)
    if mapped is not None:
        return mapped, {
            "source": "deterministic",
            "confidence": 0.99,
            "archetype": classify(prompt).archetype,
            "supported": True,
            "entity": mapped.entity,
            "title": mapped.title,
        }, []
    chosen = spec_for_prompt(prompt)
    decision = classify(prompt)
    if chosen in SPECS and not decision.low_confidence:
        return chosen, {
            "source": "catalogue",
            "confidence": 0.95,
            "archetype": decision.archetype,
            "supported": decision.archetype in SUPPORTED_ARCHETYPES,
            "entity": chosen.entity,
            "title": chosen.title,
        }, []
    if not live:
        return chosen, {
            "source": "generic-rejected",
            "confidence": 0.0,
            "archetype": decision.archetype,
            "supported": False,
            "entity": chosen.entity,
            "title": chosen.title,
        }, []
    return _model_blueprint(prompt, decision.archetype)


def _model_blueprint(prompt: str, classified: str) -> tuple[AppSpec, dict, list[dict]]:
    from terrarium_agents.llm import fast_model, invoke_bedrock_text

    system = (
        "Map an app prompt to a concise blueprint. Return JSON only with keys: "
        "supported (boolean), archetype, confidence (0..1), title (under 40 chars), "
        "entity (singular PascalCase, never Item), noun, statusField, statuses "
        "(2-4 strings), and fields (3-6 objects with name, type string|number, sample). "
        "Supported archetypes are crud, dashboard, booking, landing, charts, multi-step-form. "
        "Auth, games, file upload, media editors, and other custom interactions are unsupported. "
        "Example records must be specific to the prompt; never use Sample or Note."
    )
    user = f"Classifier guess: {classified}\nPrompt: {prompt}"
    waited = GATE.acquire()
    result = invoke_bedrock_text(
        system,
        user,
        fast_model(),
        max_tokens=900,
        temperature=0.2,
        purpose="blueprint",
    )
    GATE.release(_throttled(str(result.get("failReason") or "")))
    text = _strip(str(result.get("text") or "")).strip()
    if not result.get("ok") or not text:
        raise BlueprintUnavailable(
            str(result.get("failReason") or "blueprint provider returned no text")
        )
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        payload = {}
    confidence = max(0.0, min(1.0, float(payload.get("confidence") or 0.0)))
    archetype = str(payload.get("archetype") or classified or "unknown")
    fields = []
    for field in list(payload.get("fields") or [])[:6]:
        name = re.sub(r"[^A-Za-z0-9_]", "", str(field.get("name") or ""))
        type_name = str(field.get("type") or "string")
        sample = field.get("sample")
        if name and type_name in {"string", "number"} and str(sample).lower() not in {"sample", "note"}:
            fields.append((name, type_name, sample))
    supported = bool(payload.get("supported")) and archetype in {
        "crud", "dashboard", "booking", "landing", "charts", "multi-step-form"
    }
    title = str(payload.get("title") or "").strip()[:40]
    entity = re.sub(r"[^A-Za-z0-9]", "", str(payload.get("entity") or ""))
    statuses = tuple(str(item) for item in list(payload.get("statuses") or [])[:4] if str(item).strip())
    status_field = re.sub(r"[^A-Za-z0-9_]", "", str(payload.get("statusField") or "status")) or "status"
    mapper = {
        "source": "fast-model",
        "confidence": confidence,
        "archetype": archetype,
        "supported": supported,
        "entity": entity,
        "title": title,
    }
    call = {
        "model": result.get("model"),
        "ok": bool(result.get("ok")),
        "role": "blueprint",
        "path": "",
        "inputTokens": result.get("inputTokens"),
        "outputTokens": result.get("outputTokens"),
        "cacheCreationInputTokens": 0,
        "cacheReadInputTokens": 0,
        "durationSeconds": result.get("durationSeconds"),
        "queueSeconds": round(waited, 3),
        "failReason": result.get("failReason"),
    }
    if not supported:
        raise UnsupportedBlueprint(mapper)
    if confidence < 0.6 or not title or entity in {"", "Item"} or len(fields) < 3 or len(statuses) < 2:
        raise UnsupportedBlueprint(mapper | {"supported": False, "reason": "invalid-or-low-confidence-blueprint"})
    if not any(name == status_field for name, _kind, _sample in fields):
        fields.append((status_field, "string", statuses[0]))
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:32] or entity.lower()
    features = ("search", "status-filter", "create", "detail")
    if archetype in {"dashboard", "charts"}:
        features += ("totals",)
    spec = AppSpec(
        slug,
        title,
        prompt,
        entity,
        tuple(fields),
        features,
        status_field,
        statuses,
        str(payload.get("noun") or entity.lower()),
        pack="entity",
    )
    return spec, mapper, [call]

logger = logging.getLogger(__name__)

HAIKU_INPUT_USD = 1.0
HAIKU_OUTPUT_USD = 5.0
SONNET_INPUT_USD = 3.0
SONNET_OUTPUT_USD = 15.0


def per_file_enabled() -> bool:
    return os.environ.get("TERRARIUM_PER_FILE_CODEGEN") == "1"


class AdaptiveGate:
    """Process-wide cap. Shrinks on 429 and grows again after a clean streak."""

    def __init__(self, start: int = 8, floor: int = 2, ceiling: int = 12) -> None:
        self.limit = start
        self.floor = floor
        self.ceiling = ceiling
        self._in_use = 0
        self._ok_streak = 0
        self.throttles = 0
        self.acquires = 0
        self._cv = threading.Condition()

    def acquire(self) -> float:
        started = time.monotonic()
        with self._cv:
            self.acquires += 1
            while self._in_use >= self.limit:
                self._cv.wait(timeout=5)
            self._in_use += 1
        return time.monotonic() - started

    def release(self, throttled: bool) -> None:
        with self._cv:
            self._in_use = max(0, self._in_use - 1)
            if throttled:
                self.throttles += 1
                self.limit = max(self.floor, self.limit // 2)
                self._ok_streak = 0
            else:
                self._ok_streak += 1
                if self._ok_streak >= 24 and self.limit < self.ceiling:
                    self.limit += 1
                    self._ok_streak = 0
            self._cv.notify()


GATE = AdaptiveGate()


def _throttled(reason: str | None) -> bool:
    text = (reason or "").lower()
    return "throttl" in text or "429" in text or "too many requests" in text


def _rates(model: str) -> tuple[float, float]:
    if "haiku" in model.lower():
        return HAIKU_INPUT_USD, HAIKU_OUTPUT_USD
    return SONNET_INPUT_USD, SONNET_OUTPUT_USD


def call_cost(record: dict) -> float:
    input_usd, output_usd = _rates(str(record.get("model") or ""))
    return (
        (record.get("inputTokens") or 0) * input_usd
        + (record.get("cacheCreationInputTokens") or 0) * input_usd * 1.25
        + (record.get("cacheReadInputTokens") or 0) * input_usd * 0.1
        + (record.get("outputTokens") or 0) * output_usd
    ) / 1_000_000


def _strip(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip() + ("\n" if cleaned.strip() else "")


def stub_component(contract: Contract, component: Component) -> str:
    view = ".tsx" if contract.language == "ts" else ".jsx"
    logic = ".ts" if contract.language == "ts" else ".js"
    entity = contract.entity.name
    status = contract.spec.status_field or "status"
    statuses = ["All", *contract.spec.statuses] if contract.spec.statuses else ["All"]
    label = next((field.name for field in contract.entity.fields if field.name != "id"), "id")
    if component.name == "StatusBadge":
        body = "export default function StatusBadge({ status }) {\n  return <span className={'status-' + String(status || '').toLowerCase()}>{status}</span>\n}\n"
    elif component.name == "FilterTabs":
        body = "export default function FilterTabs({ statuses, active, onChange }) {\n  return <div className=\"filter-row\">{(statuses || []).map((status) => <button key={status} onClick={() => onChange(status)}>{status}</button>)}</div>\n}\n"
    elif component.name == "TotalsCard":
        body = "export default function TotalsCard({ totals }) {\n  return <div className=\"totals-grid\">{(totals || []).map((row) => <p key={row.date}>{row.date}: {row.count}</p>)}</div>\n}\n"
    elif component.name == "PageHero":
        icon = _icon_for(contract.spec.slug)
        body = (
            f"import {{ {icon} }} from 'lucide-react'\n"
            "export default function PageHero() {\n"
            f"  return <header className=\"hero\"><{icon} aria-hidden=\"true\" size={{28}} /><p>{entity}</p><h2>{contract.spec.title}</h2><p>Search, filter, and open a {contract.spec.noun}.</p></header>\n"
            "}\n"
        )
    elif component.name == "EmptyState":
        body = (
            "export default function EmptyState() {\n"
            f"  return <p className=\"empty\">No {contract.spec.noun} matches this filter yet.</p>\n"
            "}\n"
        )
    elif component.name.endswith("Card"):
        rows = "\n".join(
            f"      <span><em>{field.name}</em> {{String(item.{field.name} ?? '')}}</span>"
            for field in contract.entity.fields
            if field.name != "id"
        )
        body = (
            f"export default function {component.name}({{ item, onSelect }}) {{\n"
            "  return (\n"
            "    <button className=\"entity-card\" onClick={() => onSelect && onSelect(item.id)}>\n"
            f"      <strong>{{item.{label} || item.id}}</strong>\n"
            f"{rows}\n"
            "    </button>\n"
            "  )\n"
            "}\n"
        )
    elif component.name == "ListPage":
        tabs = ", ".join(json.dumps(item) for item in statuses)
        extra = ""
        if contract.component("FilterTabs"):
            extra += "      <FilterTabs statuses={STATUSES} active={active} onChange={setActive} />\n"
        badge_import = f"import FilterTabs from '../components/FilterTabs{view}'\n" if contract.component("FilterTabs") else ""
        body = (
            "import { useState } from 'react'\n"
            f"import SearchBar from '../components/SearchBar{view}'\n"
            f"{badge_import}"
            f"import {entity}Card from '../components/{entity}Card{view}'\n"
            f"import {{ use{entity}s, use{entity}Actions }} from '../hooks/useData{logic}'\n"
            f"const STATUSES = [{tabs}]\n"
            "export default function ListPage({ onOpen }) {\n"
            f"  const items = use{entity}s()\n"
            f"  const {{ select }} = use{entity}Actions()\n"
            "  const [query, setQuery] = useState('')\n"
            "  const [active, setActive] = useState('All')\n"
            "  const visible = items.filter((item) => {\n"
            f"    const statusOk = active === 'All' || item.{status} === active\n"
            "    return statusOk && JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase())\n"
            "  })\n"
            "  return (\n"
            "    <section className=\"page\">\n"
            "      <SearchBar value={query} onChange={setQuery} />\n"
            f"{extra}"
            f"      {{visible.map((item) => <{entity}Card key={{item.id}} item={{item}} onSelect={{(id) => {{ select(id); onOpen && onOpen(id) }}}} />)}}\n"
            "    </section>\n"
            "  )\n"
            "}\n"
        )
    elif component.name == "DetailPage":
        body = (
            f"import {{ useSelected{entity} }} from '../hooks/useData{logic}'\n"
            "export default function DetailPage() {\n"
            f"  const item = useSelected{entity}(null)\n"
            "  if (!item) return <p>Select an item.</p>\n"
            f"  return <article className=\"entity-card\"><h2>{{item.{label} || item.id}}</h2></article>\n"
            "}\n"
        )
    elif component.name == "FormPage":
        field = label
        body = (
            "import { useState } from 'react'\n"
            f"import {{ use{entity}Actions }} from '../hooks/useData{logic}'\n"
            "export default function FormPage() {\n"
            f"  const {{ addItem }} = use{entity}Actions()\n"
            f"  const [value, setValue] = useState('')\n"
            f"  return <form onSubmit={{(event) => {{ event.preventDefault(); addItem({{ {field}: value }}) }}}}><label>{field}<input value={{value}} onChange={{(event) => setValue(event.target.value)}} /></label></form>\n"
            "}\n"
        )
    elif component.name == "DashboardPage":
        body = (
            f"import {{ use{entity}s, useTotals }} from '../hooks/useData{logic}'\n"
            f"import TotalsCard from '../components/TotalsCard{view}'\n"
            "export default function DashboardPage() {\n"
            f"  const items = use{entity}s()\n"
            "  const totals = useTotals(items)\n"
            "  return <section className=\"page\"><h2>Totals</h2><TotalsCard totals={totals} /></section>\n"
            "}\n"
        )
    else:
        body = f"export default function {component.name}() {{ return <section className=\"page\">{component.name}</section> }}\n"
    if contract.language == "ts":
        imported = []
        for prop in component.props:
            if prop.type_name == contract.entity.name:
                imported.append(contract.entity.name)
            elif "DailyTotal" in prop.type_name:
                imported.append("DailyTotal")
        if imported:
            unique = ", ".join(dict.fromkeys(imported))
            body = f"import type {{ {unique} }} from '../types.ts'\n" + body
        body = _annotate_stub(body, component)
    return body


_ICONS = (
    "BookOpen",
    "Dog",
    "Wrench",
    "Users",
    "Leaf",
    "Truck",
    "Coffee",
    "CalendarDays",
    "Package",
    "Flower2",
    "Hammer",
    "Search",
    "Wine",
    "Landmark",
    "ClipboardList",
    "Box",
)


_ICON_BY_SLUG = {
    "library": "BookOpen",
    "kennel": "Dog",
    "parts-bin": "Wrench",
    "volunteers": "Users",
    "farm-stand": "Leaf",
    "clinic": "Package",
    "bakery": "Coffee",
    "fleet": "Truck",
    "sessions": "CalendarDays",
    "warehouse": "Box",
    "cafe": "Coffee",
    "desks": "ClipboardList",
    "rooms": "Landmark",
    "courts": "CalendarDays",
    "tours": "Landmark",
    "greenhouse": "Flower2",
    "tool-crib": "Hammer",
    "lost-found": "Search",
    "cellar": "Wine",
    "museum": "Landmark",
    "orders": "ClipboardList",
    "catalogue": "Package",
    "inventory": "Box",
    "roster": "Users",
}


def _icon_for(slug: str) -> str:
    return _ICON_BY_SLUG.get(slug) or _ICONS[sum(ord(char) for char in slug) % len(_ICONS)]


def _annotate_stub(body: str, component: Component) -> str:
    if component.props:
        props = ", ".join(f"{prop.name}: {prop.type_name}" for prop in component.props)
        body = body.replace(f"function {component.name}(", f"function {component.name}(", 1)
        body = re.sub(
            rf"function {component.name}\(([^)]*)\)",
            lambda match: f"function {component.name}({match.group(1)}: {{ {props} }})",
            body,
            count=1,
        )
    return body


@dataclass
class Outcome:
    files: dict[str, str]
    contract: Contract
    calls: list[dict] = field(default_factory=list)
    mismatches: list[Mismatch] = field(default_factory=list)
    repairs: int = 0
    implicated: list[dict] = field(default_factory=list)
    waves: int = 0
    stub_fallbacks: list[str] = field(default_factory=list)
    stages: dict[str, float] = field(default_factory=dict)
    static_ok: bool = False
    css_errors: list[str] = field(default_factory=list)
    parse_errors: list[str] = field(default_factory=list)
    pre_rewrite: dict[str, str] = field(default_factory=dict)
    first_pass_missing: list[str] = field(default_factory=list)
    rewrite_count: int = 0
    first_model_file_seconds: float | None = None
    first_model_file_path: str = ""
    files_before_repair: dict[str, str] = field(default_factory=dict)
    tsc_errors: list[str] = field(default_factory=list)
    degraded_files: list[str] = field(default_factory=list)
    repair_log: list[dict] = field(default_factory=list)
    mapper: dict = field(default_factory=dict)
    user_message: str = ""
    regenerated_files: list[str] = field(default_factory=list)

    @property
    def accepts_preview(self) -> bool:
        return bool(self.static_ok and not self.stub_fallbacks and not self.degraded_files and not self.tsc_errors)

    @property
    def cost_usd(self) -> float:
        return round(sum(call_cost(call) for call in self.calls), 6)

    @property
    def cache_read_tokens(self) -> int:
        return sum(call.get("cacheReadInputTokens") or 0 for call in self.calls)

    def public(self) -> dict:
        return {
            "slug": self.contract.spec.slug,
            "language": self.contract.language,
            "files": len(self.files),
            "llmCalls": len(self.calls),
            "repairs": self.repairs,
            "waves": self.waves,
            "mismatchCount": len(self.mismatches),
            "mismatchRate": round(mismatch_rate(self.files, self.contract), 3),
            "implicated": self.implicated,
            "stubFallbacks": self.stub_fallbacks,
            "staticOk": self.static_ok,
            "cssErrors": self.css_errors,
            "parseErrors": self.parse_errors,
            "costUsd": self.cost_usd,
            "cacheReadTokens": self.cache_read_tokens,
            "stages": {key: round(value, 3) for key, value in self.stages.items()},
            "features": feature_checks(self.contract.spec, self.files),
            "firstPassMissing": len(self.first_pass_missing),
            "rewriteCount": self.rewrite_count,
            "firstModelFileSeconds": self.first_model_file_seconds,
            "firstModelFilePath": self.first_model_file_path,
            "theme": self.contract.theme,
            "layout": self.contract.layout,
            "tscErrors": self.tsc_errors,
            "degradedFiles": self.degraded_files,
            "repairLog": self.repair_log,
            "mapper": self.mapper,
            "userMessage": self.user_message,
            "acceptsPreview": self.accepts_preview,
            "regeneratedFiles": self.regenerated_files,
        }


def feature_checks(spec: AppSpec, files: dict[str, str]) -> dict[str, bool]:
    blob = "\n".join(files.values())
    lower = blob.lower()
    checks = {"title": spec.title.lower() in lower or spec.entity.lower() in lower}
    if "search" in spec.features:
        checks["search"] = "setquery" in lower or "search" in lower
    if "status-filter" in spec.features:
        checks["status-filter"] = "filter" in lower and bool(spec.status_field and spec.status_field.lower() in lower or "statuses" in lower)
    if "create" in spec.features:
        checks["create"] = "additem" in lower and "<form" in lower
    if "detail" in spec.features:
        checks["detail"] = f"useselected{spec.entity.lower()}" in lower
    if "totals" in spec.features:
        checks["totals"] = "usetotals" in lower and "totalscard" in lower
    return checks


def _model_for(kind: str) -> str:
    from terrarium_agents.llm import fast_model, leaf_model, page_model

    if kind == "leaf":
        return leaf_model()
    if kind == "page":
        return page_model()
    return fast_model()


def _stream_file(system: str, user: str, model: str, max_tokens: int) -> dict:
    from terrarium_agents.canary import DemoBlocked, KILL_MESSAGE, kill_switch_on
    from terrarium_agents.llm_stream import stream_bedrock_text

    if kill_switch_on():
        raise DemoBlocked(KILL_MESSAGE, retry=False)
    waited = GATE.acquire()
    throttled = False
    try:
        result = stream_bedrock_text(
            system,
            user,
            model,
            max_tokens=max_tokens,
            cache_system=True,
            first_token_timeout_s=40,
            total_timeout_s=90,
        )
        throttled = _throttled(result.fail_reason)
    finally:
        GATE.release(throttled)
    return {
        "model": result.model or model,
        "ok": bool(result.ok and result.text),
        "text": _strip(result.text or ""),
        "timeToFirstTokenSeconds": result.time_to_first_token_s,
        "durationSeconds": round(result.duration_s, 3),
        "inputTokens": result.input_tokens,
        "outputTokens": result.output_tokens,
        "cacheCreationInputTokens": result.cache_creation_input_tokens,
        "cacheReadInputTokens": result.cache_read_input_tokens,
        "stopReason": result.stop_reason,
        "failReason": result.fail_reason,
        "throttled": throttled,
        "queueSeconds": round(waited, 3),
    }


def _generate_one(contract: Contract, component: Component, live: bool, extra: str = "") -> tuple[str, dict | None, bool]:
    """Return file text, call record, and whether a stub replaced an unclosed file."""
    if not live:
        return stub_component(contract, component), [], False
    from terrarium_agents.llm import fast_model

    system = shared_prefix(contract)
    user = file_task(contract, component) + (("\n" + extra) if extra else "")
    cap = token_cap(component.kind)
    records: list[dict] = []
    record = _stream_file(system, user, _model_for(component.kind), cap)
    record["path"] = component.path
    record["role"] = component.kind
    records.append(record)
    if not record["ok"]:
        fallback = _stream_file(system, user, fast_model(), cap)
        fallback["path"] = component.path
        fallback["role"] = component.kind + "-model-fallback"
        records.append(fallback)
        record = fallback
    text = record["text"]
    if record.get("stopReason") == "max_tokens" or not file_is_closed(text):
        again = _stream_file(
            system,
            user + "\nThe previous reply was cut off. Return the complete file only, with every brace closed.",
            record["model"],
            cap,
        )
        again["path"] = component.path
        again["role"] = component.kind + "-retry"
        records.append(again)
        text = again["text"]
    if not file_is_closed(text):
        return stub_component(contract, component), records, True
    return text, records, False


def _model_error_kind(records: list) -> str:
    for record in records or []:
        reason = str(record.get("failReason") or "").lower()
        if record.get("throttled") or "429" in reason or "throttl" in reason or "too many requests" in reason:
            return "throttle"
        if "timeout" in reason:
            return "timeout"
        if record.get("stopReason") == "max_tokens":
            return "truncation"
        if record.get("ok") is False:
            return "provider"
    return "truncation"


def _generate_leaf_batch(
    contract: Contract,
    leaves: list[Component],
    live: bool,
    fallback_kinds: list[str] | None = None,
) -> tuple[dict[str, str], list[dict], list[str]]:
    """One model call for the small leaf files. Pages stay separate."""
    if not leaves:
        return {}, [], []
    if not live:
        return {component.path: stub_component(contract, component) for component in leaves}, [], []
    from terrarium_agents.tagged_files import TaggedFileParser

    system = shared_prefix(contract) + "This call writes several small files. The one-file rule does not apply.\n"
    user = (
        "Write every file below. Wrap each one exactly like this:\n"
        '<<<FILE path="src/components/Example.jsx">>>\n'
        "export default function Example() { return null }\n"
        "<<<END FILE>>>\n\n"
        + "\n\n".join(file_task(contract, component) for component in leaves)
    )
    cap = min(16000, 1400 * len(leaves))
    record = _stream_file(system, user, _model_for("leaf"), cap)
    record["role"] = "leaf-batch"
    record["path"] = ",".join(component.path for component in leaves)
    parser = TaggedFileParser()
    parser.feed(str(record.get("text") or ""))
    parsed = parser.finish()
    texts: dict[str, str] = {}
    calls = [record]
    fallbacks: list[str] = []
    for component in leaves:
        body = parsed.get(component.path, "")
        if body and file_is_closed(body) and "<<<FILE" not in body:
            texts[component.path] = body
            continue
        text, records, fell_back = _generate_one(contract, component, True)
        texts[component.path] = text
        calls.extend(records)
        if fell_back:
            fallbacks.append(component.path)
            if fallback_kinds is not None:
                fallback_kinds.append(_model_error_kind(records if isinstance(records, list) else []))
    return texts, calls, fallbacks


def affected_pages(contract: Contract, kind: str, files: dict[str, str], **kwargs: object) -> list[Component]:
    """Pages the blueprint change can touch. Unchanged pages stay as they are."""
    pages = [component for component in contract.llm_components() if component.kind == "page"]
    if kind == "new-filter":
        return [component for component in pages if component.name == "ListPage"] or pages[:1]
    if kind == "new-page":
        name = str(kwargs.get("name") or "")
        return [component for component in pages if component.name == f"{name}Page"]
    if kind == "add-field":
        return [component for component in pages if component.name in {"FormPage", "DetailPage"}]
    if kind == "rename":
        old = str(kwargs.get("old") or "")
        hit = [component for component in pages if old and old in files.get(component.path, "")]
        return hit
    return pages


def apply_patches(files: dict[str, str], patches: list[dict]) -> list[str]:
    applied: list[str] = []
    for patch in patches:
        path = str(patch.get("path") or "")
        search = str(patch.get("search") or "")
        replace = str(patch.get("replace") or "")
        if path in files and search and search in files[path]:
            files[path] = files[path].replace(search, replace, 1)
            applied.append(path)
    return applied


def behaviour_notes(files: dict[str, str]) -> list[str]:
    """Model output that fights the scaffold. These go to the repair prompt."""
    notes = []
    for path, body in files.items():
        if "draft.push" in body:
            notes.append(f"{path}: draft.push is not a function. addItem takes one object, and the scaffold assigns the id.")
        if "addItem((" in body:
            notes.append(f"{path}: addItem was passed a function. Pass one plain object.")
    return notes


def repair_request(files: dict[str, str], contract: Contract, mismatches: list[Mismatch], notes: list[str] | None = None) -> tuple[str, str]:
    """The exact repair prompt. Fixture hashes use this text."""
    blocks = []
    for item in mismatches[:6]:
        snippet_caller = files.get(item.caller, "")[:1200]
        snippet_callee = files.get(item.path, "")[:800]
        blocks.append(
            f"Error: {item.detail}\nCaller {item.caller}:\n{snippet_caller}\nCallee {item.callee} at {item.path}:\n{snippet_callee}"
        )
    user = (
        "Return JSON only: {\"patches\":[{\"path\":\"...\",\"search\":\"exact text\",\"replace\":\"new text\"}]}\n"
        "Patch the caller or the callee. Keep the contract's array-versus-single return types.\n\n"
        + "\n\n".join(blocks)
    )
    if notes:
        user += "\n\nDiagnostics:\n" + "\n".join(notes)
    return shared_prefix(contract), user


def repair_files(files: dict[str, str], contract: Contract, diagnostics: list[str] | None = None) -> int:
    """Run the repair loop on an existing file map. Used by tests and by tsc."""
    repairs = 0
    extra = list(diagnostics or [])
    _parse, _css, mismatches = _static_stage(files, contract)
    notes = behaviour_notes(files) + extra
    while (mismatches or notes) and repairs < 2:
        _repair_once(files, contract, mismatches, extra)
        repairs += 1
        _parse, _css, mismatches = _static_stage(files, contract)
        notes = behaviour_notes(files) + extra
    return repairs


def run_tsc(folder: Path) -> list[str]:
    """Typecheck a generated app. A missing local tsc falls back to the sandbox image."""
    import subprocess

    if not (folder / "tsconfig.json").is_file():
        return []
    local = _tsc_command(folder, ["npx", "--no-install", "tsc", "--noEmit", "--pretty", "false"])
    if local is not None:
        return local
    return _tsc_docker(folder)


def _tsc_command(folder: Path, command: list[str]) -> list[str] | None:
    import subprocess

    try:
        proc = subprocess.run(command, cwd=folder, capture_output=True, text=True, check=False)
    except FileNotFoundError:
        return None
    combined = f"{proc.stdout}\n{proc.stderr}"
    lowered = combined.lower()
    if "not found" in lowered or "could not determine executable" in lowered or "is not recognized" in lowered:
        return None
    if "cannot find module 'react'" in lowered or "react/jsx-runtime" in lowered:
        return None
    if proc.returncode == 0:
        return []
    lines = [line for line in combined.splitlines() if "error TS" in line]
    if not lines:
        # The compiler never ran (npx refused to fetch it, a launcher crashed, and so on).
        # That is not a type error in the app, so let the sandbox image decide.
        return None
    return lines[:40]


def _docker_host_path(folder: Path) -> str:
    """Path the host Docker daemon can mount. Inside the API container this is the mount source."""
    import os
    import subprocess

    resolved = str(folder.resolve())
    metrics_host = os.environ.get("TERRARIUM_METRICS_HOST", "")
    metrics = "/app/docs/codegen-metrics"
    if metrics_host and (resolved == metrics or resolved.startswith(metrics + "/")):
        suffix = resolved[len(metrics):].replace("/", "\\")
        return metrics_host.rstrip("\\/") + suffix
    if os.name == "nt" or not os.environ.get("HOSTNAME"):
        return resolved
    try:
        proc = subprocess.run(
        ["docker", "inspect", "--format", "{{range .Mounts}}{{.Destination}}|{{.Source}}\n{{end}}", os.environ["HOSTNAME"]],
        capture_output=True,
        text=True,
        check=False,
    )
    except FileNotFoundError:
        return resolved
    best_dest = ""
    best_source = ""
    for line in proc.stdout.splitlines():
        if "|" not in line:
            continue
        dest, source = line.split("|", 1)
        dest = dest.rstrip("/")
        if resolved == dest or resolved.startswith(dest + "/"):
            if len(dest) > len(best_dest):
                best_dest = dest
                best_source = source.rstrip("/\\")
    if not best_dest:
        return resolved
    return best_source + resolved[len(best_dest):]


def _tsc_docker(folder: Path) -> list[str]:
    import subprocess

    host = _docker_host_path(folder)
    script = "ln -sfn /opt/terrarium/node_modules /work/node_modules && /opt/terrarium/node_modules/.bin/tsc --noEmit --pretty false -p /work; status=$?; rm -f /work/node_modules; exit $status"
    try:
        proc = subprocess.run(
            ["docker", "run", "--rm", "-v", f"{host}:/work", "-w", "/work", "--entrypoint", "sh", "terrarium-node-sandbox:p1-s3", "-lc", script],
            capture_output=True,
            text=True,
            check=False,
        )
        code, combined = proc.returncode, f"{proc.stdout}\n{proc.stderr}"
    except FileNotFoundError:
        try:
            code, combined = _docker_socket_run(host, script)
        except Exception:
            return ["tsc-missing"]
    if code != 0 and "error TS" not in combined:
        return ["tsc-missing"]
    if code == 0:
        return []
    return [line for line in combined.splitlines() if "error TS" in line][:40]


def _docker_socket_run(host_path: str, script: str) -> tuple[int, str]:
    """Run one sandbox command through the Docker socket. The API image has the socket and no docker CLI."""
    import socket

    body = {
        "Image": "terrarium-node-sandbox:p1-s3",
        "Entrypoint": ["sh", "-lc"],
        "Cmd": [script],
        "WorkingDir": "/work",
        "Tty": True,
        "HostConfig": {"Binds": [f"{host_path}:/work"]},
    }
    created = json.loads(_docker_http("POST", "/containers/create", body))
    container_id = created["Id"]
    try:
        _docker_http("POST", f"/containers/{container_id}/start", None)
        _docker_http("POST", f"/containers/{container_id}/wait", None)
        logs = _docker_http("GET", f"/containers/{container_id}/logs?stdout=1&stderr=1", None)
        inspected = json.loads(_docker_http("GET", f"/containers/{container_id}/json", None))
        return int(inspected["State"]["ExitCode"]), logs
    finally:
        _docker_http("DELETE", f"/containers/{container_id}?force=1", None)


def _docker_http(method: str, path: str, body: dict | None) -> str:
    import socket

    payload = b"" if body is None else json.dumps(body).encode()
    request = (
        f"{method} {path} HTTP/1.0\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: {len(payload)}\r\n\r\n"
    ).encode() + payload
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    try:
        sock.connect("/var/run/docker.sock")
        sock.sendall(request)
        data = b""
        while True:
            chunk = sock.recv(65536)
            if not chunk:
                break
            data += chunk
    finally:
        sock.close()
    header, _, rest = data.partition(b"\r\n\r\n")
    status = int(header.split(b" ", 2)[1])
    text = rest.decode("utf-8", "replace")
    if status >= 300 and method != "DELETE":
        raise RuntimeError(text[:400])
    return text


def typecheck_files(files: dict[str, str]) -> list[str]:
    """Write a generated app and typecheck it. Used by the repair loop when tsc is enabled."""
    import shutil
    import tempfile

    mounted = Path("/app/docs/codegen-metrics")
    if mounted.is_dir():
        root = mounted / "tsc-work"
        if root.exists():
            shutil.rmtree(root, ignore_errors=True)
        root.mkdir(parents=True, exist_ok=True)
        try:
            _write_tree(root, files)
            return [line for line in run_tsc(root) if line != "tsc-missing"]
        finally:
            shutil.rmtree(root, ignore_errors=True)
    with tempfile.TemporaryDirectory(prefix="terrarium-tsc-") as folder:
        root = Path(folder)
        _write_tree(root, files)
        return [line for line in run_tsc(root) if line != "tsc-missing"]


def _write_tree(root: Path, files: dict[str, str]) -> None:
    for path, body in files.items():
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


def _repair_once(files: dict[str, str], contract: Contract, mismatches: list[Mismatch], extra: list[str] | None = None) -> dict:
    from terrarium_agents.llm import fast_model, invoke_bedrock_text

    implicated = []
    for item in mismatches[:6]:
        implicated.append({"caller": item.caller, "callee": item.callee, "prop": item.prop, "detail": item.detail})
    system, user = repair_request(files, contract, mismatches, behaviour_notes(files) + list(extra or []))
    waited = GATE.acquire()
    result = invoke_bedrock_text(system, user, fast_model(), max_tokens=1200, temperature=0.2, purpose="repair")
    GATE.release(_throttled(str(result.get("failReason") or "")))
    raw = str(result.get("text") or "")
    parsed: dict = {}
    try:
        parsed = json.loads(_strip(raw).strip())
    except json.JSONDecodeError:
        parsed = {}
    patches = list(parsed.get("patches") or [])
    applied = apply_patches(files, patches)
    missed = []
    for patch in patches:
        path = str(patch.get("path") or "")
        search = str(patch.get("search") or "")
        if search and path not in applied:
            missed.append(patch)
    return {
        "model": result.get("model"),
        "ok": bool(result.get("ok")),
        "role": "repair",
        "path": ",".join(applied),
        "inputTokens": result.get("inputTokens"),
        "outputTokens": result.get("outputTokens"),
        "cacheCreationInputTokens": None,
        "cacheReadInputTokens": None,
        "durationSeconds": result.get("durationSeconds"),
        "queueSeconds": round(waited, 3),
        "throttled": _throttled(str(result.get("failReason") or "")),
        "failReason": result.get("failReason"),
        "implicated": implicated,
        "applied": applied,
        "prompt": user,
        "diagnostics": list(extra or []),
        "attemptedFix": raw,
        "missed": missed,
    }


def _leaf_path_from_diagnostic(files: dict[str, str], contract: Contract, diagnostic: str) -> str | None:
    """A tsc line on a scaffold page points at the leaf component used on that line."""
    match = re.search(r"(src[/\\][^(:]+?\.(?:tsx?|jsx?))\((\d+),(\d+)\)", diagnostic)
    if not match:
        return None
    path = match.group(1).replace("\\", "/")
    line_no = int(match.group(2))
    column = int(match.group(3))
    model_paths = {component.path for component in contract.llm_components()}
    if path in model_paths:
        return path
    lines = files.get(path, "").splitlines()
    if not 1 <= line_no <= len(lines):
        return None
    chosen = None
    for tag in re.finditer(r"<([A-Z][A-Za-z0-9]*)\b", lines[line_no - 1]):
        if tag.start() + 1 <= column:
            chosen = tag.group(1)
    if chosen is None:
        found = re.search(r"<([A-Z][A-Za-z0-9]*)\b", lines[line_no - 1])
        chosen = found.group(1) if found else None
    if not chosen:
        return None
    component = contract.component(chosen)
    if component is None or component.path not in model_paths:
        return None
    return component.path


def _regenerate_missed(
    files: dict[str, str],
    contract: Contract,
    missed: list[dict],
    diagnostics: list[str],
    attempt: int,
    calls: list[dict],
    fallbacks: list[str],
    fallback_kinds: list[str],
) -> list[str]:
    """One new generation for each file whose repair patch matched nothing."""
    components = {component.path: component for component in contract.llm_components()}
    regenerated: list[str] = []
    seen: set[str] = set()
    for patch in missed:
        path = str(patch.get("path") or "").replace("\\", "/")
        component = components.get(path)
        if component is None:
            for diagnostic in diagnostics:
                leaf = _leaf_path_from_diagnostic(files, contract, diagnostic)
                if leaf and leaf in components:
                    component = components[leaf]
                    break
        if component is None or component.path in seen:
            continue
        seen.add(component.path)
        extra = (
            f"Attempt {attempt}. The previous repair patch matched nothing.\n"
            f"Previous patch:\n{json.dumps(patch, ensure_ascii=True)}\n"
            "Error:\n" + "\n".join(str(item) for item in diagnostics[:8])
        )
        text, records, fell_back = _generate_one(contract, component, True, extra)
        files[component.path] = text
        calls.extend(records if isinstance(records, list) else [])
        regenerated.append(component.path)
        if fell_back:
            fallbacks.append(component.path)
            fallback_kinds.append(_model_error_kind(records if isinstance(records, list) else []))
    return regenerated


def _preview_message(
    *,
    kinds: list[str],
    degraded: list[str],
    tsc_errors: list[str],
    regenerated: list[str],
    static_ok: bool,
) -> str:
    if static_ok and not kinds and not degraded and not tsc_errors:
        if regenerated:
            return "Regenerated a file because the repair patch did not match."
        return ""
    sentences: list[str] = []
    if "throttle" in kinds:
        sentences.append("The model was throttled.")
    if "timeout" in kinds:
        sentences.append("The model timed out.")
    if "provider" in kinds:
        sentences.append("The model provider returned an error.")
    if "truncation" in kinds:
        sentences.append("The model reply was cut off.")
    if regenerated and "throttle" not in kinds and "timeout" not in kinds and "provider" not in kinds and "truncation" not in kinds:
        sentences.append("The repair patch did not match, so that file was regenerated.")
    if degraded:
        sentences.append("A generated file was replaced with the scaffold default.")
    if tsc_errors:
        sentences.append("The generated app still has type errors.")
    sentences.append("This preview was not validated.")
    return " ".join(sentences)


def deterministic_tsc_fixes(files: dict[str, str], diagnostics: list[str]) -> list[str]:
    """Apply narrow, semantics-preserving fixes before spending a repair call."""
    if not any("TS2322" in item and "symbol" in item for item in diagnostics):
        return []
    implicated = set()
    for diagnostic in diagnostics:
        match = re.search(r"(src[/\\][^( :]+?\.(?:tsx?|jsx?))(?::|\()", diagnostic)
        if match:
            implicated.add(match.group(1).replace("\\", "/"))
    changed: list[str] = []
    for path in sorted(implicated):
        body = files.get(path, "")
        if not path.endswith((".tsx", ".ts")):
            continue
        fixed = re.sub(
            r"import type \{ ([A-Za-z_$][\w$]*) \} from '\.\./hooks/useData(?:\.ts)?'",
            r"import type { \1 } from '../types.ts'",
            body,
        )
        fixed = re.sub(r"key=\{([A-Za-z_$][\w$]*)\}", r"key={String(\1)}", fixed)
        fixed = re.sub(r"\{([A-Za-z_$][\w$]*)\}(?=\s*</)", r"{String(\1)}", fixed)
        if fixed != body:
            files[path] = fixed
            changed.append(path)
    return changed


def degrade_failed_files(
    files: dict[str, str],
    contract: Contract,
    diagnostics: list[str],
    mismatches: list[Mismatch],
) -> list[str]:
    """After the repair budget, replace only implicated model files with safe defaults."""
    paths: set[str] = set()
    for diagnostic in diagnostics:
        leaf = _leaf_path_from_diagnostic(files, contract, diagnostic)
        if leaf:
            paths.add(leaf)
        match = re.search(r"(src[/\\][^( :]+?\.(?:tsx?|jsx?))(?::|\()", diagnostic)
        if match:
            paths.add(match.group(1).replace("\\", "/"))
    for mismatch in mismatches:
        paths.add(mismatch.caller)
    components = {component.path: component for component in contract.llm_components()}
    degraded = []
    for path in sorted(paths):
        component = components.get(path)
        if component is None:
            continue
        files[path] = stub_component(contract, component)
        degraded.append(path)
    return degraded


def _interface_summary(files: dict[str, str], contract: Contract) -> str:
    lines = []
    for component in contract.components:
        if component.kind != "leaf":
            continue
        text = files.get(component.path, "")
        signature = next((line for line in text.splitlines() if line.startswith("export default function")), component.example)
        lines.append(f"{component.name}: {signature} example {component.example}")
    return "\n".join(lines)


def _static_stage(files: dict[str, str], contract: Contract) -> tuple[list[str], list[str], list[Mismatch]]:
    normalize_imports(files, contract)
    parse_errors = []
    css_errors: list[str] = []
    for path, content in files.items():
        if path.endswith((".js", ".jsx", ".ts", ".tsx")) and not file_is_closed(content):
            parse_errors.append(f"{path} is unclosed")
        if path.endswith(".css"):
            css_errors.extend(f"{path}: {problem}" for problem in css_problems(content))
    return parse_errors, css_errors, find_mismatches(files, contract)


def run_per_file(
    prompt: str,
    language: str = "jsdoc",
    *,
    live: bool = False,
    spec: AppSpec | None = None,
    mapper_info: dict | None = None,
    initial_calls: list[dict] | None = None,
    on_model_file: object = None,
) -> Outcome:
    if spec is None:
        chosen, mapper, blueprint_calls = resolve_prompt_spec(prompt, live=live)
    else:
        chosen = spec
        mapper = mapper_info or {
            "source": "explicit",
            "confidence": 1.0,
            "supported": True,
            "entity": chosen.entity,
            "title": chosen.title,
        }
        blueprint_calls = list(initial_calls or [])
    contract = build_contract(chosen, language)
    started = time.monotonic()
    files = deterministic_files(contract)
    files_done = time.monotonic()
    calls: list[dict] = blueprint_calls
    fallbacks: list[str] = []
    fallback_kinds: list[str] = []
    regenerated: list[str] = []
    tasks = list(contract.llm_components())

    first_model = {"seconds": None, "path": ""}

    def _run(component: Component, extra: str = "") -> None:
        text, records, fell_back = _generate_one(contract, component, live, extra)
        if component.kind == "page":
            text = strip_page_chrome(text)
        files[component.path] = text
        calls.extend(records)
        if fell_back:
            fallbacks.append(component.path)
            fallback_kinds.append(_model_error_kind(records if isinstance(records, list) else []))
        if component.kind in {"leaf", "page"} and first_model["seconds"] is None:
            first_model["seconds"] = round(time.monotonic() - started, 3)
            first_model["path"] = component.path
        if on_model_file and component.kind in {"leaf", "page"}:
            on_model_file(component.path, text)

    wave_started = time.monotonic()
    leaves = [component for component in tasks if component.kind == "leaf"]
    pages = [component for component in tasks if component.kind == "page"]
    if live and tasks:
        leaf_system = shared_prefix(contract) + "This call writes several small files. The one-file rule does not apply.\n"
        warm = _stream_file(leaf_system, "Reply with the single word ok.", _model_for("leaf"), 32)
        warm["role"] = "warmup"
        warm["path"] = ""
        calls.append(warm)
    batched, batch_calls, batch_fallbacks = _generate_leaf_batch(contract, leaves, live, fallback_kinds)
    calls.extend(batch_calls)
    fallbacks.extend(batch_fallbacks)
    for path, text in batched.items():
        files[path] = text
        if first_model["seconds"] is None:
            first_model["seconds"] = round(time.monotonic() - started, 3)
            first_model["path"] = path
        if on_model_file:
            on_model_file(path, text)
    with ThreadPoolExecutor(max_workers=min(4, max(1, len(pages)))) as pool:
        futures = [pool.submit(_run, component) for component in pages]
        for future in as_completed(futures):
            future.result()
    generated_at = time.monotonic()
    for path, content in list(files.items()):
        if "/views/" in path:
            files[path] = strip_page_chrome(content)
    pre_rewrite = dict(files)
    first_missing = missing_imports(pre_rewrite, contract)
    parse_errors, css_errors, mismatches = _static_stage(files, contract)
    rewrite_count = sum(1 for path, body in files.items() if pre_rewrite.get(path) != body)
    parsed_at = time.monotonic()
    repairs = 0
    implicated: list[dict] = []
    notes = behaviour_notes(files)
    check_types = live or os.environ.get("TERRARIUM_RUN_TSC") == "1"
    deterministic_fixes: list[str] = []
    if check_types and language == "ts":
        notes.extend(typecheck_files(files))
        deterministic_fixes.extend(deterministic_tsc_fixes(files, notes))
        if deterministic_fixes:
            notes = behaviour_notes(files) + typecheck_files(files)
    files_before_repair = dict(files)
    repair_log: list[dict] = []
    while live and (mismatches or notes) and repairs < 2:
        repair = _repair_once(files, contract, mismatches, notes)
        calls.append(repair)
        repair_log.append({
            "prompt": repair.get("prompt"),
            "diagnostics": repair.get("diagnostics"),
            "attemptedFix": repair.get("attemptedFix"),
            "applied": repair.get("applied"),
        })
        implicated.extend(repair.get("implicated") or [])
        repairs += 1
        regenerated.extend(
            _regenerate_missed(
                files,
                contract,
                list(repair.get("missed") or []),
                list(repair.get("diagnostics") or notes),
                repairs,
                calls,
                fallbacks,
                fallback_kinds,
            )
        )
        parse_errors, css_errors, mismatches = _static_stage(files, contract)
        notes = behaviour_notes(files)
        if check_types and language == "ts":
            notes.extend(typecheck_files(files))
    waves = 0
    if live and mismatch_rate(files, contract) > 0.10:
        summary = _interface_summary(files, contract)
        pages = [component for component in tasks if component.kind == "page"]
        with ThreadPoolExecutor(max_workers=min(8, max(1, len(pages)))) as pool:
            futures = [pool.submit(_run, component, "Leaf interfaces:\n" + summary) for component in pages]
            for future in as_completed(futures):
                future.result()
        waves = 1
        parse_errors, css_errors, mismatches = _static_stage(files, contract)
        notes = behaviour_notes(files)
        if check_types and language == "ts":
            notes.extend(typecheck_files(files))
        while (mismatches or notes) and repairs < 2:
            repair = _repair_once(files, contract, mismatches, notes)
            calls.append(repair)
            repair_log.append({
                "prompt": repair.get("prompt"),
                "diagnostics": repair.get("diagnostics"),
                "attemptedFix": repair.get("attemptedFix"),
                "applied": repair.get("applied"),
            })
            implicated.extend(repair.get("implicated") or [])
            repairs += 1
            regenerated.extend(
                _regenerate_missed(
                    files,
                    contract,
                    list(repair.get("missed") or []),
                    list(repair.get("diagnostics") or notes),
                    repairs,
                    calls,
                    fallbacks,
                    fallback_kinds,
                )
            )
            parse_errors, css_errors, mismatches = _static_stage(files, contract)
            notes = behaviour_notes(files)
            if check_types and language == "ts":
                notes.extend(typecheck_files(files))
    degraded: list[str] = []
    if live and (mismatches or notes) and repairs >= 2:
        degraded = degrade_failed_files(files, contract, notes, mismatches)
        if degraded:
            parse_errors, css_errors, mismatches = _static_stage(files, contract)
            notes = behaviour_notes(files)
            if check_types and language == "ts":
                notes.extend(typecheck_files(files))
    finished = time.monotonic()
    lock_scaffold(files, contract)
    if check_types and language == "ts":
        notes = behaviour_notes(files) + typecheck_files(files)
    else:
        notes = behaviour_notes(files)
    parse_errors, css_errors, mismatches = _static_stage(files, contract)
    tsc_errors = [item for item in notes if "error TS" in item or item == "tsc-missing"]
    static_ok = not parse_errors and not css_errors and not mismatches and not notes
    message = _preview_message(
        kinds=fallback_kinds,
        degraded=degraded,
        tsc_errors=tsc_errors,
        regenerated=regenerated,
        static_ok=static_ok,
    )
    outcome = Outcome(
        files=files,
        contract=contract,
        calls=calls,
        mismatches=mismatches,
        repairs=repairs,
        implicated=implicated,
        waves=waves,
        stub_fallbacks=fallbacks,
        css_errors=css_errors,
        parse_errors=parse_errors,
        static_ok=static_ok,
        stages={
            "deterministicSeconds": files_done - started,
            "generateSeconds": generated_at - wave_started,
            "checkSeconds": parsed_at - generated_at,
            "repairSeconds": finished - parsed_at,
            "staticTotalSeconds": finished - started,
        },
        pre_rewrite=pre_rewrite,
        first_pass_missing=first_missing,
        rewrite_count=rewrite_count,
        first_model_file_seconds=first_model["seconds"],
        first_model_file_path=first_model["path"],
        files_before_repair=files_before_repair,
        tsc_errors=tsc_errors,
        degraded_files=degraded,
        repair_log=repair_log,
        mapper=mapper,
        user_message=message,
        regenerated_files=regenerated,
    )
    from terrarium_agents.llm_fixtures import note_repair

    note_repair(contract.spec.slug, repairs)
    return outcome


def run_blueprint_edit(base_files: dict[str, str], spec: AppSpec, kind: str, *, live: bool = False, **kwargs: object) -> Outcome:
    """Regenerate behaviour in code and record model output for affected presentation files."""
    from terrarium_agents.contract_v2 import apply_blueprint_edit

    edited = apply_blueprint_edit(spec, kind, **kwargs)
    started = time.monotonic()
    language = "ts" if any(path.endswith((".ts", ".tsx")) for path in base_files) else "jsdoc"
    outcome = run_per_file(edited.prompt, language=language, spec=edited, live=False)
    files = dict(outcome.files)
    for path, body in base_files.items():
        if "/components/" in path and "AppShell" not in path and "Navbar" not in path and "SearchBar" not in path:
            files[path] = body
    contract = outcome.contract
    targets = [component for component in affected_pages(contract, kind, files, **kwargs) if component.kind != "scaffold"]
    if kind in {"add-field", "rename"}:
        card = contract.component(f"{contract.entity.name}Card")
        if card:
            targets.append(card)
    elif kind == "new-filter":
        badge = contract.component("StatusBadge")
        if badge:
            targets.append(badge)
    elif kind == "change-label":
        hero = contract.component("PageHero")
        if hero:
            targets.append(hero)
    targets = list({component.path: component for component in targets}.values())
    if kind == "rename":
        old, new = str(kwargs.get("old") or ""), str(kwargs.get("new") or "")
        if old and new:
            pattern = re.compile(rf"\b{re.escape(old)}\b")
            for path, body in list(files.items()):
                if "/components/" in path and pattern.search(body):
                    files[path] = pattern.sub(new, body)
    calls: list[dict] = []

    def _run(component: Component) -> None:
        try:
            text, records, _fell = _generate_one(
                contract,
                component,
                live,
                "The blueprint changed. Update this presentation file only.",
            )
        except Exception as exc:
            from terrarium_agents.llm_fixtures import MissingFixture, llm_mode

            if not isinstance(exc, MissingFixture) or llm_mode() != "replay":
                raise
            text, records = stub_component(contract, component), []
        files[component.path] = strip_page_chrome(text) if component.kind == "page" else text
        calls.extend(records)

    if live and targets:
        with ThreadPoolExecutor(max_workers=min(8, len(targets))) as pool:
            list(pool.map(_run, targets))
    lock_scaffold(files, contract)
    finished = time.monotonic()
    return Outcome(
        files=files,
        contract=contract,
        calls=calls,
        static_ok=True,
        stages={"editSeconds": finished - started},
        first_model_file_seconds=round(finished - started, 3) if calls else 0,
        first_model_file_path=targets[0].path if targets else "",
    )


def generate_per_file(job: object, plan: object = None, *, on_file: object = None) -> object:
    """Worker entry. Used only when the feature flag is on."""
    from terrarium_agents.llm import agents_mode
    from terrarium_contracts import AgentResult

    _ = plan
    prompt = getattr(job, "prompt", "") or ""
    try:
        outcome = run_per_file(
            prompt,
            language=os.environ.get("TERRARIUM_PER_FILE_LANGUAGE", "ts"),
            live=agents_mode() == "live",
            on_model_file=on_file,
        )
    except UnsupportedBlueprint as unsupported:
        # The gate only stops prompts it can name. A vague prompt reaches the blueprint step,
        # and when the model calls it unsupported the session ends with the same plain message.
        from terrarium_agents.canary import NOT_SUPPORTED_MESSAGE, DemoBlocked, demo_mode

        if demo_mode():
            raise DemoBlocked(NOT_SUPPORTED_MESSAGE, retry=False) from unsupported
        raise
    if agents_mode() == "live" and not outcome.accepts_preview:
        import logging

        from terrarium_agents.canary import DemoBlocked

        logging.getLogger(__name__).warning(
            "Preview not validated: tsc=%s degraded=%s mismatches=%s parse=%s",
            [item[:240] for item in outcome.tsc_errors[:12]],
            outcome.degraded_files,
            [str(item)[:160] for item in list(outcome.mismatches)[:8]],
            [str(item)[:160] for item in list(outcome.parse_errors)[:8]],
        )
        raise DemoBlocked(outcome.user_message or "This preview was not validated.", retry=True)
    summary = getattr(getattr(job, "intent", None), "summary", "") or prompt
    return AgentResult(files=outcome.files, commitMessage=f"Per-file {outcome.contract.spec.slug}: {summary[:60]}")


def catalog() -> tuple[AppSpec, ...]:
    return SPECS
