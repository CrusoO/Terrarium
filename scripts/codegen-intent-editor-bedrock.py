"""One live intent call and one live editor call on Bedrock, not the free Gemini key.

The editor fixture has a search box and no city field. The prompt asks for a city.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))
sys.path.insert(0, str(ROOT / "packages" / "py-contracts"))
os.environ.pop("TERRARIUM_ALLOW_FREE_GEMINI", None)
os.environ["TERRARIUM_AGENTS"] = "live"

import terrarium_agents.llm  # noqa: E402,F401

from terrarium_agents.editor import run_editor  # noqa: E402
from terrarium_agents.intent import IntentAgent  # noqa: E402
from terrarium_agents.llm import drain_llm_calls, fast_model  # noqa: E402
from terrarium_contracts import AgentJob, Intent, IntentAgentInput  # noqa: E402

OUT = ROOT / "docs" / "codegen-metrics" / "intent-editor-bedrock.json"
LIST = """\
import { useState } from "react";

export default function OrderList({ orders }) {
  const [query, setQuery] = useState("");
  const visible = orders.filter((order) => order.customer.toLowerCase().includes(query.toLowerCase()));
  return (
    <section>
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul>{visible.map((order) => <li key={order.id}>{order.customer}</li>)}</ul>
    </section>
  );
}
"""


def main() -> None:
    drain_llm_calls()
    intent_row: dict = {"provider": "bedrock", "model": fast_model()}
    started = time.monotonic()
    try:
        output = IntentAgent().classify(
            IntentAgentInput(
                prompt="Build a customer order tracker with a searchable list and a dashboard.",
                sessionId="spike-intent",
            )
        )
        intent_row["ok"] = True
        intent_row["seconds"] = round(time.monotonic() - started, 3)
        intent_row["kind"] = output.kind
        intent_row["phase"] = output.phase
        intent_row["stack"] = output.stack
    except Exception as error:
        intent_row["ok"] = False
        intent_row["seconds"] = round(time.monotonic() - started, 3)
        intent_row["error"] = f"{type(error).__name__}: {error}"
    intent_calls = drain_llm_calls()

    editor_row: dict = {"provider": "bedrock", "model": fast_model()}
    prompt = "Add a city field to each order card. Show the city next to the customer name."
    started = time.monotonic()
    try:
        result = run_editor(
            AgentJob(
                sessionId="spike-editor",
                intent=Intent(kind="modify", stack="react", summary="Add a city field"),
                prompt=prompt,
                files={"src/views/OrderList.jsx": LIST},
            )
        )
        changed = "\n".join(result.files.values())
        editor_row["ok"] = True
        editor_row["seconds"] = round(time.monotonic() - started, 3)
        editor_row["files"] = sorted(result.files)
        editor_row["commitMessage"] = result.commitMessage
        editor_row["cityAdded"] = "city" in changed.lower() and "city" not in LIST.lower()
        editor_row["originalAlreadyHadCity"] = "city" in LIST.lower()
    except Exception as error:
        editor_row["ok"] = False
        editor_row["seconds"] = round(time.monotonic() - started, 3)
        editor_row["error"] = f"{type(error).__name__}: {error}"
    editor_calls = drain_llm_calls()
    summary = {
        "freeGeminiEnv": os.environ.get("TERRARIUM_ALLOW_FREE_GEMINI"),
        "intent": intent_row,
        "intentCalls": intent_calls,
        "editor": editor_row,
        "editorCalls": editor_calls,
    }
    OUT.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
