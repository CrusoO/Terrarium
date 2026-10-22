"""Canned model responses for repair and load tests. Never calls Bedrock."""

from __future__ import annotations

import json
import random
import re
from typing import Any

from terrarium_agents.contract_v2 import AppSpec, Component, build_contract
from terrarium_agents.per_file import stub_component
from terrarium_agents.llm_stream import StreamResult

_FILE_RE = re.compile(r"Write the complete file (\S+)")


class FakeProvider:
    """Returns stub files, or one deliberately broken file, with sampled latency."""

    def __init__(
        self,
        spec: AppSpec,
        *,
        broken: str | None = None,
        latencies: list[float] | None = None,
        seed: int = 0,
    ) -> None:
        self.contract = build_contract(spec)
        self.broken = broken
        self.latencies = latencies or [0.4, 1.2, 3.5, 8.0]
        self._rng = random.Random(seed)
        self.calls: list[dict[str, Any]] = []

    def sample(self) -> float:
        return float(self._rng.choice(self.latencies))

    def stream(
        self,
        system: str,
        user: str,
        model: str,
        *,
        purpose: str = "codegen",
        max_tokens: int = 16000,
        cache_system: bool = False,
    ) -> StreamResult:
        latency = self.sample()
        paths = _FILE_RE.findall(user)
        self.calls.append({"kind": "stream", "purpose": purpose, "paths": paths, "latency": latency})
        if not paths or user.startswith("Reply with"):
            return self._result("ok", model, latency, system, cache_system)
        if len(paths) > 1 or user.startswith("Write every file"):
            parts = [
                f'<<<FILE path="{path}">>>\n{self._file(path)}\n<<<END FILE>>>'
                for path in paths
            ]
            return self._result("\n".join(parts), model, latency, system, cache_system)
        return self._result(self._file(paths[0]), model, latency, system, cache_system)

    def invoke(
        self,
        system: str,
        user: str,
        model: str,
        *,
        max_tokens: int,
        temperature: float,
        purpose: str = "repair",
    ) -> dict[str, Any]:
        _ = (system, user, max_tokens, temperature, purpose)
        latency = self.sample()
        self.calls.append({"kind": "invoke", "purpose": purpose, "latency": latency})
        if purpose == "blueprint":
            return {
                "ok": True,
                "text": json.dumps({
                    "supported": True,
                    "archetype": "crud",
                    "confidence": 0.86,
                    "title": "Parcel shelf",
                    "entity": "Parcel",
                    "noun": "parcel",
                    "statusField": "status",
                    "statuses": ["Waiting", "Collected"],
                    "fields": [
                        {"name": "recipient", "type": "string", "sample": "Mina Cole"},
                        {"name": "shelf", "type": "string", "sample": "B-4"},
                        {"name": "status", "type": "string", "sample": "Waiting"},
                    ],
                }),
                "model": model,
                "durationSeconds": latency,
                "inputTokens": 120,
                "outputTokens": 80,
                "failReason": None,
            }
        text = '{"patches":[]}'
        if self.broken == "cardinality" or "mapped as an array" in user:
            text = json.dumps(
                {
                    "patches": [
                        {
                            "path": "src/views/ListPage.jsx",
                            "search": "selected.map((row) => <li key={row.id}>{row.name}</li>)",
                            "replace": "selected && selected.name",
                        }
                    ]
                }
            )
        elif self.broken == "push" or "draft.push" in user:
            text = json.dumps(
                {
                    "patches": [
                        {
                            "path": "src/views/FormPage.jsx",
                            "search": "addItem((draft) => { draft.push({ name: 'x' }) })",
                            "replace": "addItem({ name: 'x' })",
                        }
                    ]
                }
            )
        elif self.broken == "function" or "passed a function" in user:
            text = json.dumps(
                {
                    "patches": [
                        {
                            "path": "src/views/FormPage.jsx",
                            "search": "addItem((draft) => { draft.name = 'x' })",
                            "replace": "addItem({ name: 'x' })",
                        }
                    ]
                }
            )
        elif self.broken == "tsc" or "error TS" in user:
            text = json.dumps(
                {
                    "patches": [
                        {
                            "path": "src/views/ListPage.tsx",
                            "search": "const label: number = 'Canary'",
                            "replace": "const label: string = 'Canary'",
                        }
                    ]
                }
            )
        return {
            "ok": True,
            "text": text,
            "model": model,
            "durationSeconds": latency,
            "inputTokens": 120,
            "outputTokens": 40,
            "failReason": None,
        }

    def _file(self, path: str) -> str:
        broken = self._broken(path)
        if broken is not None:
            return broken
        component = self._component(path)
        if component is None:
            return "export default function Missing() { return null }\n"
        return stub_component(self.contract, component)

    def _component(self, path: str) -> Component | None:
        for component in self.contract.components:
            if component.path == path:
                return component
        return None

    def _broken(self, path: str) -> str | None:
        if self.broken in {"unclosed", "import", "cardinality"} and path.endswith("ListPage.jsx"):
            hook = next(
                (
                    item.name
                    for item in self.contract.hooks
                    if item.cardinality == "single" and item.name.startswith("useSelected")
                ),
                "useSelectedItem",
            )
            if self.broken == "unclosed":
                return "export default function ListPage() {\n  return (\n    <div>\n"
            if self.broken == "import":
                return (
                    f"import {{ {hook} }} from '../data/useData'\n"
                    "export default function ListPage() { return <p>bad import</p> }\n"
                )
            return (
                f"import {{ {hook} }} from '../hooks/useData.js'\n"
                "export default function ListPage() {\n"
                f"  const selected = {hook}()\n"
                "  return <ul>{selected.map((row) => <li key={row.id}>{row.name}</li>)}</ul>\n"
                "}\n"
            )
        if self.broken == "function" and path.endswith("FormPage.jsx"):
            return (
                "export default function FormPage() {\n"
                "  return <button onClick={() => addItem((draft) => { draft.name = 'x' })}>Add</button>\n"
                "}\n"
            )
        return None

    def _result(self, text: str, model: str, latency: float, system: str, cache_system: bool) -> StreamResult:
        return StreamResult(
            text=text,
            provider="fake",
            model=model,
            ok=True,
            duration_s=latency,
            time_to_first_token_s=min(0.2, latency),
            input_tokens=max(1, len(system) // 4),
            output_tokens=max(1, len(text) // 4),
            cache_read_input_tokens=(len(system) // 4) if cache_system else 0,
            usage_source="fake",
            stop_reason="end_turn",
        )
