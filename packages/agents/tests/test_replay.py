"""Replay, fixtures, fake provider, spend guard, and staged sweeps. No Bedrock."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from terrarium_agents.canary import canary_per_file
from terrarium_agents.contract_v2 import (
    SPECS,
    build_contract,
    deterministic_files,
    file_is_closed,
    find_mismatches,
    missing_imports,
    shared_prefix,
)
from terrarium_agents.fake_provider import FakeProvider
from terrarium_agents.fixture_build import snapshot_files, triage_saved
from terrarium_agents.llm_fixtures import (
    MissingFixture,
    SpendExceeded,
    assert_repair_budget,
    fixtures_root,
    install_provider,
    llm_mode,
    note_repair,
    request_hash,
    reset_run,
    spend_summary,
    write_fixture,
)
from terrarium_agents.llm_stream import stream_bedrock_text
from terrarium_agents.per_file import _static_stage, run_blueprint_edit, run_per_file
from terrarium_agents.sweep import dry_run, run_staged

ROOT = Path(__file__).resolve().parents[3]


def test_replay_is_the_default_and_a_missing_fixture_errors(monkeypatch):
    monkeypatch.setenv("CODEGEN_LLM_MODE", "replay")
    assert llm_mode() == "replay"
    install_provider(None)
    with pytest.raises(MissingFixture):
        stream_bedrock_text("system-that-was-never-recorded", "user-that-was-never-recorded", "no-such-model", max_tokens=8)


def test_cached_prefix_is_byte_identical():
    locked = (fixtures_root() / "cached-prefix.txt").read_text(encoding="utf-8")
    assert shared_prefix(build_contract(SPECS[0])) == locked


def test_catalogue_replays_without_a_live_call():
    reset_run()
    install_provider(None)
    outcome = run_per_file(SPECS[0].prompt, live=True, spec=SPECS[0])
    summary = spend_summary()
    assert outcome.files["src/views/ListPage.jsx"]
    assert summary["liveCalls"] == 0
    assert summary["usd"] == 0
    assert summary["replayHits"] > 0
    scaffold = deterministic_files(outcome.contract)
    assert "public/favicon.svg" in scaffold
    assert "favicon.svg" in scaffold["index.html"]


def test_two_apps_back_to_back_report_cache_reads():
    reset_run()
    install_provider(None)
    run_per_file(SPECS[0].prompt, live=True, spec=SPECS[0])
    run_per_file(SPECS[1].prompt, live=True, spec=SPECS[1])
    summary = spend_summary()
    assert summary["cacheReadTokens"] > 0
    assert summary["usd"] == 0


def test_edit_regenerates_from_fixtures():
    reset_run()
    install_provider(None)
    base = run_per_file(SPECS[0].prompt, live=False, spec=SPECS[0]).files
    outcome = run_blueprint_edit(
        base,
        SPECS[0],
        "add-field",
        live=True,
        name="note",
        type_name="string",
        sample="Leave at door",
    )
    assert spend_summary()["liveCalls"] == 0
    assert outcome.files
    renamed = run_blueprint_edit(
        base,
        SPECS[2],
        "rename",
        live=True,
        old="owner",
        new="lead",
    )
    assert renamed.files
    assert spend_summary()["liveCalls"] == 0


def test_monolith_snapshot_replays_a_saved_app():
    files = snapshot_files("landing-1")
    assert files
    assert all("<<<FILE" not in body for body in files.values())


def test_triage_names_the_saved_crash_without_a_model_call():
    before = spend_summary()["liveCalls"]
    report = triage_saved()
    assert spend_summary()["liveCalls"] == before
    assert any(item["kind"] == "draft.push" and item["slug"] == "crud-2" for item in report["findings"])


def test_record_missing_does_not_overwrite_an_existing_hash(tmp_path, monkeypatch):
    monkeypatch.setenv("CODEGEN_FIXTURES_DIR", str(tmp_path))
    monkeypatch.setenv("CODEGEN_LLM_MODE", "record-missing")
    digest = write_fixture(
        provider="bedrock",
        model="m",
        system="s",
        user="u",
        params={"maxTokens": 1, "cacheSystem": False, "purpose": "codegen"},
        text="first",
        input_tokens=1,
        output_tokens=1,
        latency_seconds=0.1,
        force=True,
    )
    write_fixture(
        provider="bedrock",
        model="m",
        system="s",
        user="u",
        params={"maxTokens": 1, "cacheSystem": False, "purpose": "codegen"},
        text="second",
        input_tokens=1,
        output_tokens=1,
        latency_seconds=0.1,
        force=False,
    )
    saved = json.loads((tmp_path / "records" / f"{digest}.json").read_text(encoding="utf-8"))
    assert saved["text"] == "first"
    assert digest == request_hash("bedrock", "m", "s", "u", {"maxTokens": 1, "cacheSystem": False, "purpose": "codegen"})


def test_spend_guard_aborts_before_a_live_call(monkeypatch):
    monkeypatch.setenv("CODEGEN_LLM_MODE", "live")
    monkeypatch.setenv("CODEGEN_MAX_SPEND_USD", "0.0001")
    reset_run()
    install_provider(None)
    from terrarium_agents.llm_fixtures import resolve_stream

    with pytest.raises(SpendExceeded):
        resolve_stream("x" * 200000, "y" * 200000, "anthropic.claude-sonnet-4-6", max_tokens=16000)


def test_repair_budget_fails_above_two_per_app():
    reset_run()
    note_repair("a", 3)
    note_repair("b", 3)
    with pytest.raises(RuntimeError):
        assert_repair_budget(2)


def test_fake_provider_broken_files_hit_the_gates():
    provider = FakeProvider(SPECS[0], broken="unclosed", latencies=[0.2])
    body = provider.stream("s", "Write the complete file src/views/ListPage.jsx and nothing else.", "m").text
    assert not file_is_closed(body)
    _parse, _css, _mismatch = _static_stage({"src/views/ListPage.jsx": body}, provider.contract)
    assert any("unclosed" in item for item in _parse)

    imported = FakeProvider(SPECS[0], broken="import", latencies=[0.2])
    bad = imported.stream("s", "Write the complete file src/views/ListPage.jsx and nothing else.", "m").text
    assert missing_imports({"src/views/ListPage.jsx": bad}, imported.contract)

    function = FakeProvider(SPECS[0], broken="function", latencies=[0.2])
    form = function.stream("s", "Write the complete file src/views/FormPage.jsx and nothing else.", "m").text
    assert "addItem((" in form

    cardinality = FakeProvider(SPECS[0], broken="cardinality", latencies=[0.2])
    page = cardinality.stream("s", "Write the complete file src/views/ListPage.jsx and nothing else.", "m").text
    assert find_mismatches({"src/views/ListPage.jsx": page}, cardinality.contract)


def _repair(broken: str, path: str, body: str) -> str:
    from terrarium_agents.contract_v2 import build_contract, deterministic_files
    from terrarium_agents.per_file import repair_files

    contract = build_contract(SPECS[0])
    files = deterministic_files(contract)
    files[path] = body
    install_provider(FakeProvider(SPECS[0], broken=broken, latencies=[0.1]))
    try:
        count = repair_files(files, contract, diagnostics=["src/views/ListPage.tsx(1,7): error TS2322"] if broken == "tsc" else None)
    finally:
        install_provider(None)
    assert count >= 1
    assert spend_summary()["liveCalls"] == 0
    return files[path]


def test_fake_provider_repairs_the_three_broken_shapes():
    reset_run()
    page = _repair(
        "cardinality",
        "src/views/ListPage.jsx",
        "import { useSelectedOrder } from '../hooks/useData.js'\n"
        "export default function ListPage() {\n"
        "  const selected = useSelectedOrder()\n"
        "  return <ul>{selected.map((row) => <li key={row.id}>{row.name}</li>)}</ul>\n"
        "}\n",
    )
    assert "selected.map" not in page
    form = _repair(
        "function",
        "src/views/FormPage.jsx",
        "export default function FormPage() {\n"
        "  return <button onClick={() => addItem((draft) => { draft.name = 'x' })}>Add</button>\n"
        "}\n",
    )
    assert "addItem((" not in form
    pushed = _repair(
        "push",
        "src/views/FormPage.jsx",
        "export default function FormPage() {\n"
        "  return <button onClick={() => addItem((draft) => { draft.push({ name: 'x' }) })}>Add</button>\n"
        "}\n",
    )
    assert "draft.push" not in pushed
    typed = _repair(
        "tsc",
        "src/views/ListPage.tsx",
        "const label: number = 'Canary'\nexport default function ListPage() { return <p>{label}</p> }\n",
    )
    assert "const label: string" in typed


def test_fake_load_samples_recorded_latencies():
    manifest = json.loads((fixtures_root() / "manifest.json").read_text(encoding="utf-8"))
    latencies = manifest["latencies"]
    assert latencies
    provider = FakeProvider(SPECS[0], latencies=latencies, seed=1)
    samples = [
        provider.stream("system", "Reply with the single word ok.", "fake-model").duration_s
        for _ in range(20)
    ]
    assert all(sample in latencies for sample in samples)
    ordered = sorted(samples)
    p95 = ordered[min(len(ordered) - 1, max(0, int(round(0.95 * (len(ordered) - 1)))))]
    assert p95 >= min(latencies)


def test_unclosed_monolith_files_regenerate_one_each():
    from terrarium_agents.contract_v2 import file_is_closed
    from terrarium_agents.truncation import regenerate_unclosed

    root = ROOT / "docs" / "codegen-metrics" / "monolith-holdout"
    files: dict[str, str] = {}
    for path in root.rglob("*"):
        if not path.is_file() or "dist" in path.parts or "node_modules" in path.parts:
            continue
        if path.suffix.lower() not in {".js", ".jsx", ".css"}:
            continue
        body = path.read_text(encoding="utf-8")
        if not file_is_closed(body):
            files[path.relative_to(root).as_posix()] = body
    assert len(files) == 12
    provider = FakeProvider(SPECS[0], latencies=[0])

    def regenerate(path: str) -> str:
        return provider.stream("s", f"Write the complete file {path} and nothing else.", "fake").text

    regenerate_unclosed(files, regenerate)
    assert [call["paths"] for call in provider.calls] == [[path] for path in files]
    assert all(file_is_closed(body) for body in files.values())


def test_production_mix_is_haiku_and_repairs_are_in_the_estimate():
    plan = dry_run(model="production")
    assert plan["productionMix"]["leaf"] == "eu.anthropic.claude-haiku-5-5"
    assert plan["productionMix"]["page"] == "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
    assert plan["productionMix"]["monolith"] == "anthropic.claude-sonnet-4-6"
    assert plan["stages"][0]["repairMargin"] == 0.15
    assert plan["stages"][0]["estimatedUsd"] > plan["stages"][0]["beforeRepairsUsd"]
    assert plan["liveSpendUsd"] == 0


def test_dry_run_prints_cost_and_stages_stop_on_failure():
    plan = dry_run(model="haiku")
    assert plan["dryRun"] is True
    assert plan["liveSpendUsd"] == 0
    assert [stage["stage"] for stage in plan["stages"]] == [5, 20, 50]
    assert plan["byTask"]
    seen: list[int] = []

    def runner(count: int) -> dict:
        seen.append(count)
        return {"ok": count < 20}

    report = run_staged(runner)
    assert seen == [5, 20]
    assert report["stopped"] is True


def test_browser_harness_keeps_date_and_favicon_fixes():
    script = (ROOT / "scripts" / "codegen-canary-browser.mjs").read_text(encoding="utf-8")
    assert "2024-07-01" in script
    assert "datetime-local" in script
    assert "layout-split" in script
    assert "HTMLInputElement" in script
    assert "setValue" in script
    assert "favicon" in script
    index = deterministic_files(build_contract(SPECS[0]))["index.html"]
    assert "favicon.svg" in index


def test_fixtures_have_no_secrets_and_records_are_ignored():
    from terrarium_agents.fixture_build import scan_fixtures

    report = scan_fixtures()
    assert report["secrets"] == []
    assert report["bytes"] > 0
    ignored = (ROOT / ".gitignore").read_text(encoding="utf-8")
    assert "docs/codegen-metrics/fixtures/records/" in ignored


def test_entity_pages_are_scaffold_and_select_after_add():
    from dataclasses import replace

    from terrarium_agents.contract_v2 import build_contract, deterministic_files

    contract = build_contract(SPECS[0])
    assert contract.component("ListPage").kind == "scaffold"
    assert contract.component("DetailPage").kind == "scaffold"
    assert contract.component("FormPage").kind == "scaffold"
    assert contract.component("FilterTabs").kind == "scaffold"
    assert contract.component("StatusBadge").kind == "leaf"
    files = deterministic_files(contract)
    assert "selectedId = id" in files["src/hooks/useData.js"]
    assert "addItem(values)" in files["src/views/FormPage.jsx"]
    assert "filter-row" in files["src/components/FilterTabs.jsx"]
    assert all(item.kind == "leaf" for item in contract.llm_components())
    bare = replace(SPECS[0], features=("search",), statuses=(), status_field=None, pack="landing")
    forced = deterministic_files(build_contract(bare))
    assert "src/views/DetailPage.jsx" in forced
    assert "data-route=\"form\"" in forced["src/App.jsx"]
    assert "filter-row" in forced["src/components/FilterTabs.jsx"]


BROKEN_APP = """<!doctype html><html><body>
<button type="button" data-route="list">List</button>
<button type="button" data-route="form">New</button>
<button type="button" data-route="detail">Detail</button>
<div id="view"></div>
<script>
const cards = ["Ceramic Bowl 1", "Ceramic Bowl 2", "Ceramic Bowl 3", "Ceramic Bowl 4"];
function render(route) {
  const view = document.getElementById("view");
  if (route === "form") {
    view.innerHTML = '<form onsubmit="event.preventDefault()"><input /><button type="submit">Add</button></form>';
    return;
  }
  if (route === "detail") {
    view.innerHTML = "<p>Select an item.</p>";
    return;
  }
  view.innerHTML = '<div class="filter-row"><button type="button">All</button><button type="button">Kitchen</button></div>'
    + cards.map((name) => '<div class="entity-card"><button type="button">' + name + '</button></div>').join("");
}
document.querySelectorAll("[data-route]").forEach((button) => {
  button.addEventListener("click", () => render(button.getAttribute("data-route")));
});
render("list");
</script>
</body></html>
"""


def test_broken_app_fails_the_interaction_gate(tmp_path: Path):
    """Add does nothing, detail never shows the row, and filter does not narrow."""
    import socket
    import subprocess
    import threading
    from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

    (tmp_path / "index.html").write_text(BROKEN_APP, encoding="utf-8")
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(tmp_path), **kwargs)

        def log_message(self, _format, *_args):
            return

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        proc = subprocess.run(
            ["node", str(ROOT / "scripts" / "codegen-canary-browser.mjs"), str(tmp_path), str(port), str(tmp_path / "broken.png")],
            capture_output=True,
            text=True,
            check=False,
            timeout=60,
        )
    finally:
        server.shutdown()
    payload = json.loads(next(line for line in proc.stdout.splitlines() if line.startswith("{")))
    behaviour = payload["behaviour"]
    assert behaviour["added"] is False
    assert behaviour["detailHasText"] is False
    assert behaviour["filterNarrowed"] is False
    assert payload["interactionValidated"] is False


def test_scaffold_typescript_is_clean(tmp_path):
    from terrarium_agents.per_file import run_tsc, stub_component

    contract = build_contract(SPECS[0], "ts")
    files = deterministic_files(contract)
    for component in contract.llm_components():
        files[component.path] = stub_component(contract, component)
    for path, body in files.items():
        target = tmp_path / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")
    assert run_tsc(tmp_path) == []


def test_fake_provider_tsc_errors_drop_after_repair(tmp_path):
    from terrarium_agents.per_file import repair_files, run_tsc, stub_component

    contract = build_contract(SPECS[0], "ts")
    files = deterministic_files(contract)
    for component in contract.llm_components():
        files[component.path] = stub_component(contract, component)
    files["src/views/ListPage.tsx"] += "\nconst label: number = 'Canary'\n"

    def count(name: str) -> list[str]:
        folder = tmp_path / name
        for path, body in files.items():
            target = folder / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(body, encoding="utf-8")
        return run_tsc(folder)

    before = count("before")
    assert before
    reset_run()
    install_provider(FakeProvider(SPECS[0], broken="tsc", latencies=[0.1]))
    try:
        repairs = repair_files(files, contract, diagnostics=before)
    finally:
        install_provider(None)
    after = count("after")
    assert repairs >= 1
    assert len(before) > len(after)
    assert after == []


def test_twenty_unseen_prompts_map_to_real_entities():
    from terrarium_agents.contract_v2 import UNSEEN_PROMPTS, ui_is_relevant

    assert len(UNSEEN_PROMPTS) == 20
    hits = 0
    for prompt in UNSEEN_PROMPTS:
        outcome = run_per_file(prompt, language="ts")
        spec = outcome.contract.spec
        rendered = "\n".join(outcome.files.values())
        samples = [str(sample) for _name, _type_name, sample in spec.fields]
        if spec.entity != "Item" and spec.title.lower() != " ".join(prompt.split()[:6]).lower() and "Sample" not in samples and "Note" not in samples and ui_is_relevant(rendered, spec):
            hits += 1
    assert hits == 20


def test_low_confidence_prompt_uses_fast_blueprint_model():
    from terrarium_agents.per_file import resolve_prompt_spec

    reset_run()
    provider = FakeProvider(SPECS[0], latencies=[0.1])
    install_provider(provider)
    try:
        spec, mapper, calls = resolve_prompt_spec("parcels pls", live=True)
    finally:
        install_provider(None)
    assert spec.entity == "Parcel"
    assert spec.title == "Parcel shelf"
    assert mapper["source"] == "fast-model"
    assert mapper["confidence"] == 0.86
    assert calls[0]["role"] == "blueprint"


def test_generic_item_fails_relevance():
    from terrarium_agents.contract_v2 import pack_spec, ui_is_relevant

    spec = pack_spec("Make something vague", "crud")
    rendered = "Make something vague Item name status note Sample 1 Note 1"
    assert ui_is_relevant(rendered, spec) is False


def test_symbol_tsc_fix_and_file_degradation_are_deterministic():
    from terrarium_agents.per_file import degrade_failed_files, deterministic_tsc_fixes

    contract = build_contract(SPECS[0], "ts")
    files = deterministic_files(contract)
    card = next(item for item in contract.llm_components() if item.name == "OrderCard")
    files[card.path] = (
        "import type { Order } from '../hooks/useData.ts'\n"
        "export default function OrderCard({ item }: { item: Order }) {\n"
        "  const field: keyof Order = 'id'\n"
        "  return <span key={field}>{field}</span>\n"
        "}\n"
    )
    diagnostics = [
        f"{card.path}(4,16): error TS2322: Type 'string | number | symbol' is not assignable to type 'Key'",
    ]
    assert deterministic_tsc_fixes(files, diagnostics) == [card.path]
    assert "from '../types.ts'" in files[card.path]
    assert "key={String(field)}" in files[card.path]
    assert "{String(field)}</span>" in files[card.path]

    files[card.path] = "broken"
    degraded = degrade_failed_files(files, contract, diagnostics, [])
    assert degraded == [card.path]
    assert "entity-card" in files[card.path]


def test_live_stage1_relevance_is_two_of_five():
    import re

    root = ROOT / "docs" / "codegen-metrics" / "live-stage1"
    folders = sorted(path for path in root.iterdir() if path.is_dir() and not path.name.endswith("-firstpass"))
    relevant = []
    for folder in folders:
        app = (folder / "src" / "App.tsx").read_text(encoding="utf-8")
        seed = (folder / "src" / "data" / "seed.ts").read_text(encoding="utf-8")
        title = re.search(r'list:\s*"([^"]+)"', app)
        heading = title.group(1) if title else ""
        generic = heading.lower().startswith("build a") or ('"Sample"' in seed and '"Note"' in seed)
        if not generic:
            relevant.append(folder.name)
    assert len(folders) == 5
    assert len(relevant) == 2
    assert any("roster" in name for name in relevant)
    assert any("inventory" in name for name in relevant)


def test_visual_variety_across_twenty_apps():
    from terrarium_agents.contract_v2 import UNSEEN_PROMPTS, visual_signature

    signatures = [visual_signature(run_per_file(prompt, language="ts").files) for prompt in UNSEEN_PROMPTS]
    assert len({item[2] for item in signatures}) >= 6
    assert {item[1] for item in signatures} == {"page", "split", "board"}
    assert len({item[3] for item in signatures}) >= 6


def test_replay_accounting_includes_cache_reads():
    report = dry_run(model="production")
    assert report["cacheReadTokens"] > 0


def test_router_stays_offline(monkeypatch):
    monkeypatch.setenv("TERRARIUM_PER_FILE_CODEGEN", "canary")
    assert canary_per_file("canary-session", "Track orders with search, a list, and a detail view", "") is False


def test_scanner_rules_are_on_disk_without_importing_docker():
    text = (ROOT / "packages" / "sandbox" / "terrarium_sandbox" / "trust" / "scanners.py").read_text(encoding="utf-8")
    assert "inner-html-from-input" in text
    assert "external-fetch" in text


class _FailureProvider(FakeProvider):
    def __init__(self, spec, mode: str) -> None:
        super().__init__(spec, latencies=[0.0])
        self.mode = mode
        self.users: list[str] = []

    def stream(self, system, user, model, *, purpose="codegen", max_tokens=16000, cache_system=False):
        self.users.append(user)
        if self.mode == "truncation":
            from terrarium_agents.llm_stream import StreamResult

            return StreamResult(
                text="export default function Cut() {\n",
                provider="fake",
                model=model,
                ok=True,
                stop_reason="max_tokens",
                duration_s=0,
            )
        if self.mode in {"timeout", "throttle", "provider"}:
            from terrarium_agents.llm_stream import StreamResult

            reason = {
                "timeout": "timeout",
                "throttle": "429 too many requests",
                "provider": "provider error",
            }[self.mode]
            return StreamResult(text="", provider="fake", model=model, ok=False, fail_reason=reason, duration_s=0)
        return super().stream(
            system, user, model, purpose=purpose, max_tokens=max_tokens, cache_system=cache_system
        )

    def _file(self, path: str) -> str:
        card = path.endswith("OrderCard.jsx") or path.endswith("OrderCard.tsx")
        if self.mode == "miss" and card and any("Attempt " in item for item in self.users):
            return super()._file(path)
        if self.mode in {"miss", "two", "tsc"} and card:
            if self.mode == "tsc":
                return "const label: number = 'Canary'\nexport default function OrderCard() { return <p>{label}</p> }\n"
            return "export default function OrderCard() { return addItem((draft) => draft) }\n"
        return super()._file(path)

    def invoke(self, system, user, model, *, max_tokens, temperature, purpose="repair"):
        if self.mode in {"miss", "two", "tsc"} and purpose == "repair":
            suffix = "tsx" if self.mode == "tsc" else "jsx"
            return {
                "ok": True,
                "text": json.dumps(
                    {
                        "patches": [
                            {
                                "path": f"src/components/OrderCard.{suffix}",
                                "search": "THIS SEARCH MATCHES NOTHING",
                                "replace": "export default function OrderCard() { return null }\n",
                            }
                        ]
                    }
                ),
                "model": model,
                "durationSeconds": 0,
                "inputTokens": 10,
                "outputTokens": 10,
                "failReason": None,
            }
        return super().invoke(system, user, model, max_tokens=max_tokens, temperature=temperature, purpose=purpose)


def _assert_not_a_false_success(outcome, needle: str) -> None:
    assert outcome.user_message
    assert needle in outcome.user_message
    assert "not validated" in outcome.user_message or "Regenerated a file" in outcome.user_message
    assert outcome.accepts_preview is False or "Regenerated a file" in outcome.user_message
    if not outcome.accepts_preview:
        assert "not validated" in outcome.user_message


def test_injected_failures_end_with_a_message_and_are_not_a_success():
    spec = SPECS[0]
    expectations = {
        "timeout": "timed out",
        "throttle": "throttled",
        "provider": "provider returned an error",
        "truncation": "cut off",
    }
    for mode, needle in expectations.items():
        reset_run()
        install_provider(_FailureProvider(spec, mode))
        try:
            outcome = run_per_file(spec.prompt, live=True, spec=spec)
        finally:
            install_provider(None)
        _assert_not_a_false_success(outcome, needle)
        assert outcome.accepts_preview is False

    reset_run()
    provider = _FailureProvider(spec, "miss")
    install_provider(provider)
    try:
        outcome = run_per_file(spec.prompt, live=True, spec=spec)
    finally:
        install_provider(None)
    assert any("Attempt 1" in user and "THIS SEARCH MATCHES NOTHING" in user for user in provider.users)
    assert any("addItem was passed a function" in user for user in provider.users)
    assert outcome.user_message
    assert outcome.regenerated_files
    assert outcome.accepts_preview is True

    reset_run()
    install_provider(_FailureProvider(spec, "two"))
    try:
        outcome = run_per_file(spec.prompt, live=True, spec=spec)
    finally:
        install_provider(None)
    _assert_not_a_false_success(outcome, "scaffold default")
    assert outcome.degraded_files
    assert outcome.repairs == 2

    reset_run()
    install_provider(_FailureProvider(spec, "tsc"))
    try:
        outcome = run_per_file(spec.prompt, "ts", live=True, spec=spec)
    finally:
        install_provider(None)
    _assert_not_a_false_success(outcome, "not validated")
    assert outcome.accepts_preview is False
    assert outcome.repairs == 2


def test_demo_mode_stops_unsupported_and_other_accounts(monkeypatch):
    from terrarium_agents.canary import DemoBlocked, demo_block_reason, set_canary_actor
    from terrarium_agents.codegen import generate
    from terrarium_contracts import AgentJob, Intent

    monkeypatch.setenv("DEMO_MODE", "1")
    monkeypatch.delenv("TERRARIUM_KILL_SWITCH", raising=False)

    def job(prompt: str) -> AgentJob:
        return AgentJob(
            sessionId="demo-session",
            intent=Intent(kind="new", stack="react", summary=prompt[:40]),
            prompt=prompt,
        )

    with pytest.raises(DemoBlocked, match="not supported in this demo"):
        generate(job("Build a 3D racing game with a lap timer."))

    set_canary_actor("stranger@example.com")
    with pytest.raises(DemoBlocked, match="not supported in this demo"):
        generate(job("Purchase order tracker with search, a status filter, an add form and a detail view."))
    set_canary_actor("testadmin@gmail.com")
    assert demo_block_reason(
        "demo-session",
        "hi build me a ecommerce website like amazon",
    ) is None
    set_canary_actor("codegen.step0.terrarium@gmail.com")
    result = generate(job("Purchase order tracker with search, a status filter, an add form and a detail view."))
    assert result.commitMessage.startswith("Per-file")
    monkeypatch.setenv("TERRARIUM_KILL_SWITCH", "1")
    with pytest.raises(DemoBlocked, match="kill switch"):
        generate(job("Purchase order tracker with search, a status filter, an add form and a detail view."))
    set_canary_actor("")


def test_unsupported_blueprint_ends_cleanly_in_demo_mode(monkeypatch):
    from terrarium_agents import per_file
    from terrarium_agents.canary import DemoBlocked
    from terrarium_contracts import AgentJob, Intent

    def refuse(prompt, *, live):
        raise per_file.UnsupportedBlueprint({"archetype": "unknown", "supported": False})

    monkeypatch.setattr(per_file, "resolve_prompt_spec", refuse)
    job = AgentJob(
        sessionId="vague-session",
        intent=Intent(kind="new", stack="react", summary="vague"),
        prompt="Build a sample application",
    )
    monkeypatch.setenv("DEMO_MODE", "1")
    with pytest.raises(DemoBlocked, match="not supported in this demo") as caught:
        per_file.generate_per_file(job)
    assert caught.value.retry is False

    monkeypatch.delenv("DEMO_MODE")
    with pytest.raises(per_file.UnsupportedBlueprint):
        per_file.generate_per_file(job)


def test_scaffold_page_diagnostic_degrades_the_leaf():
    from terrarium_agents.per_file import degrade_failed_files, stub_component

    contract = build_contract(SPECS[0], "ts")
    files = deterministic_files(contract)
    for component in contract.llm_components():
        files[component.path] = "export default function Broken() { return null }\n"
    lines = files["src/views/ListPage.tsx"].splitlines()
    line_no = next(index for index, line in enumerate(lines, start=1) if "<" in line and "Card" in line)
    diagnostic = f"src/views/ListPage.tsx({line_no},80): error TS2322: Type '{{ }}' is not assignable to type 'IntrinsicAttributes'."
    degraded = degrade_failed_files(files, contract, [diagnostic], [])
    assert degraded
    assert all(path.startswith("src/components/") for path in degraded)
    assert files[degraded[0]] == stub_component(contract, contract.component(degraded[0].split("/")[-1].replace(".tsx", "")))

