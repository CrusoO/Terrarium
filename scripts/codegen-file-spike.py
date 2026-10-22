"""Per-file generation spike. Scripts only: this does not change the product pipeline.

Loads the saved order-tracker blueprint (docs/codegen-metrics/token-share.json),
keeps 12 business files, and generates them in parallel against one shared
contract. Scaffold and UI-kit files are copied, not generated.

Reports per-call first-token time, tokens, duration, wall time, throttle rate,
and cost with and without a cached system prefix. Writes the assembled app for
a later vite build. Does not raise the 16000 cap; each file ask is max 2000.
"""

from __future__ import annotations

import json
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))
import terrarium_agents.llm  # noqa: E402,F401

from terrarium_agents.llm import bedrock_model  # noqa: E402
from terrarium_agents.llm_stream import stream_bedrock_text  # noqa: E402

BLUEPRINT = ROOT / "docs" / "codegen-metrics" / "token-share.json"
OUT = ROOT / "docs" / "codegen-metrics" / "file-spike.json"
APP = ROOT / "docs" / "codegen-metrics" / "spike-app"

INPUT_USD = 3.0
OUTPUT_USD = 15.0
CACHE_WRITE_USD = 3.75
CACHE_READ_USD = 0.30

TASKS = [
    ("src/main.jsx", "Render <App /> inside React StrictMode. Import './styles/global.css' and './App.jsx'."),
    ("src/App.jsx", "Render Navbar title Orders, then Dashboard, OrderList, and NewOrder inside AppShell and OrderProvider."),
    ("src/data/seedData.js", "Export SEED_ORDERS, eight orders, each with id, customer, city, items[{name,qty,price}], pickupDate, paymentStatus."),
    ("src/context/OrderContext.jsx", "Export OrderProvider and useOrders. State is orders, addOrder, selectedId, setSelectedId. Seed from SEED_ORDERS."),
    ("src/hooks/useDailyTotals.js", "Export useDailyTotals(orders) returning [{date, count, total}] grouped by pickupDate."),
    ("src/components/OrderCard.jsx", "Export default OrderCard({ order, onSelect }). Show customer, city, paymentStatus via StatusBadge, and item count."),
    ("src/components/OrderTable.jsx", "Export default OrderTable({ orders, onSelect }). A table of customer, city, pickupDate, paymentStatus."),
    ("src/views/OrderList.jsx", "Export default OrderList. SearchBox plus buttons for All, Paid, Unpaid, Partial. Filter SEED orders from useOrders. Render OrderCard list."),
    ("src/views/OrderDetail.jsx", "Export default OrderDetail. Show the selected order from useOrders, or a short empty state."),
    ("src/views/NewOrder.jsx", "Export default NewOrder. Form fields customer, city, pickupDate, paymentStatus. Submit calls addOrder."),
    ("src/views/Dashboard.jsx", "Export default Dashboard. Render DailyTotalsCard with totals from useDailyTotals(orders)."),
    ("src/styles/global.css", "Style body, .app-shell, .navbar, .order-card, .status-paid, .status-unpaid, .status-partial, form, and table. No CSS framework."),
]

SHARED = """\
You write exactly one file for a Vite React order tracker. Reply with the raw file only.
No markdown fences, no explanation, no other files.

Order shape: { id, customer, city, items: [{ name, qty, price }], pickupDate, paymentStatus }.
paymentStatus is Paid, Unpaid, or Partial.

Imports you may use, and must not redefine:
- ../components/AppShell.jsx default export function AppShell({ children })
- ../components/Navbar.jsx default export function Navbar({ title })
- ../components/StatusBadge.jsx default export function StatusBadge({ status })
- ../components/SearchBar.jsx default export function SearchBar({ value, onChange, placeholder })
- ../components/Modal.jsx default export function Modal({ open, title, onClose, children })
- ../components/DailyTotalsCard.jsx default export function DailyTotalsCard({ totals })
- ../data/seedData.js named export SEED_ORDERS
- ../context/OrderContext.jsx named exports OrderProvider and useOrders
- ../hooks/useDailyTotals.js named export useDailyTotals
- ../components/OrderCard.jsx default export OrderCard
- ../components/OrderTable.jsx default export OrderTable
- ../views/Dashboard.jsx ../views/OrderList.jsx ../views/OrderDetail.jsx ../views/NewOrder.jsx default exports

useOrders() returns { orders, addOrder, selectedId, setSelectedId }.
addOrder(draft) assigns the next id. totals is [{ date, count, total }].
Adjust the relative prefix to the file you are writing. Do not invent packages.
Do not use template SQL, network calls, or a backend.

UI kit class names already used by the scaffold, for the stylesheet and className strings:
.app-shell wraps the page. .navbar is the top bar. .order-card is one order.
.status-paid .status-unpaid .status-partial color the badge. .search-bar is the input row.
.filter-row holds the status buttons. .totals-grid holds daily totals. .order-form is the form.
.empty-state is the detail placeholder. .order-table is the table. .page is each view section.
Keep each file under 120 lines. Use function components. JavaScript only, no TypeScript.

Field rules, repeated so the shared prefix is cacheable and identical on every call:
id is a string like ORD-1001 and is assigned by addOrder, never typed by staff.
customer is the person name, required, trimmed. city is the pickup city, required.
items is a non-empty list. qty is an integer greater than zero. price is a number.
pickupDate is YYYY-MM-DD. paymentStatus is exactly Paid, Unpaid, or Partial.
Dashboard reads totals and does not edit orders. OrderList filters in memory.
OrderDetail reads selectedId. NewOrder only calls addOrder. OrderCard does not fetch.
OrderTable does not own state. The stylesheet does not import JavaScript.
Do not add react-router. Do not add a second package.json. Do not rename exports.
Empty search shows every order in the current status tab. Status All shows every match.
The first screen a staff member sees is the list under the Orders navbar title.

Screen copy the generated files may use, so every call shares this prefix:
Orders. New order. Daily totals. No orders yet. Select an order. Customer. City.
Pickup date. Payment status. Paid. Unpaid. Partial. All. Search orders. Add order.
Item. Quantity. Price. Save. Close. Dashboard. Order list. Order detail.
Staff enter a customer, a city, at least one item, a pickup date, and a payment status.
The list filters by the search text and the status button together.
The detail panel shows items with quantity and price and a line total.
The dashboard groups orders by pickup date and sums price times quantity.
Seed data uses city names and customer names. Do not call fetch. Do not import CSS frameworks.
"""
SHARED += "\n".join(
    f"Prefix line {index}: class .{name} is owned by the scaffold stylesheet and may be referenced, not redefined, in JSX className strings."
    for index, name in enumerate(
        [
            "app-shell", "navbar", "page", "order-card", "order-table", "order-form",
            "search-bar", "filter-row", "totals-grid", "empty-state", "status-paid",
            "status-unpaid", "status-partial", "modal", "item-row", "line-total",
        ]
        * 8,
        start=1,
    )
)


SCAFFOLD = {
    "package.json": json.dumps(
        {
            "name": "order-tracker-spike",
            "private": True,
            "type": "module",
            "scripts": {
                "dev": "vite --host 0.0.0.0 --port 5173",
                "build": "vite build",
                "preview": "vite preview --host 0.0.0.0 --port 5173",
            },
        },
        indent=2,
    )
    + "\n",
    "vite.config.js": "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n",
    "index.html": "<!doctype html><html><head><meta charset=\"UTF-8\" /><title>Orders</title></head><body><div id=\"root\"></div><script type=\"module\" src=\"/src/main.jsx\"></script></body></html>\n",
    "src/components/AppShell.jsx": "export default function AppShell({ children }) { return <div className=\"app-shell\">{children}</div>; }\n",
    "src/components/Navbar.jsx": "export default function Navbar({ title }) { return <header className=\"navbar\"><h1>{title}</h1></header>; }\n",
    "src/components/StatusBadge.jsx": "export default function StatusBadge({ status }) { return <span className={'status-' + String(status || '').toLowerCase()}>{status}</span>; }\n",
    "src/components/SearchBar.jsx": "export default function SearchBar({ value, onChange, placeholder }) { return <input className=\"search-bar\" value={value} placeholder={placeholder || 'Search'} onChange={(event) => onChange(event.target.value)} />; }\n",
    "src/components/Modal.jsx": "export default function Modal({ open, title, onClose, children }) { if (!open) return null; return <div className=\"modal\"><h2>{title}</h2><button onClick={onClose}>Close</button>{children}</div>; }\n",
    "src/components/DailyTotalsCard.jsx": "export default function DailyTotalsCard({ totals }) { return <div className=\"totals-grid\">{(totals || []).map((row) => <p key={row.date}>{row.date}: {row.count} / {row.total}</p>)}</div>; }\n",
}


def _cost(row: dict) -> float:
    return (
        (row.get("inputTokens") or 0) * INPUT_USD
        + (row.get("cacheCreationInputTokens") or 0) * CACHE_WRITE_USD
        + (row.get("cacheReadInputTokens") or 0) * CACHE_READ_USD
        + (row.get("outputTokens") or 0) * OUTPUT_USD
    ) / 1_000_000


def _uncached_cost(row: dict) -> float:
    tokens = (row.get("inputTokens") or 0) + (row.get("cacheCreationInputTokens") or 0) + (row.get("cacheReadInputTokens") or 0)
    return (tokens * INPUT_USD + (row.get("outputTokens") or 0) * OUTPUT_USD) / 1_000_000


def _throttled(reason: str | None) -> bool:
    text = (reason or "").lower()
    return "throttl" in text or "429" in text or "too many requests" in text


def _strip(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned[: cleaned.rfind("```")]
    return cleaned.strip() + "\n"


def _one(path: str, instruction: str, cache: bool, batch_started: float, first: dict) -> dict:
    user = f"Write the file {path}. {instruction}"

    def _on_chunk(entry: dict) -> None:
        if first.get("at") is None:
            with first["lock"]:
                if first.get("at") is None:
                    first["at"] = time.monotonic()

    result = stream_bedrock_text(
        SHARED,
        user,
        bedrock_model(),
        on_chunk=_on_chunk,
        max_tokens=2000,
        cache_system=cache,
        first_token_timeout_s=45,
        total_timeout_s=90,
    )
    return {
        "path": path,
        "ok": bool(result.ok and result.text.strip()),
        "model": result.model,
        "timeToFirstTokenSeconds": result.time_to_first_token_s,
        "durationSeconds": round(result.duration_s, 3),
        "inputTokens": result.input_tokens,
        "outputTokens": result.output_tokens,
        "cacheCreationInputTokens": result.cache_creation_input_tokens,
        "cacheReadInputTokens": result.cache_read_input_tokens,
        "stopReason": result.stop_reason,
        "failReason": result.fail_reason,
        "throttled": _throttled(result.fail_reason),
        "text": _strip(result.text) if result.text else "",
        "batchOffsetSeconds": round(time.monotonic() - batch_started, 3),
    }


def _level(name: str, concurrency: int, cache: bool, warmup: bool) -> dict:
    tasks = list(TASKS)
    warmup_row = None
    if warmup:
        holder = {"at": None, "lock": threading.Lock()}
        warmup_row = _one(tasks[0][0], tasks[0][1], True, time.monotonic(), holder)
        warmup_row["warmup"] = True
    holder = {"at": None, "lock": threading.Lock()}
    started = time.monotonic()
    rows: list[dict] = []
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(_one, path, instruction, cache, started, holder) for path, instruction in tasks]
        for future in as_completed(futures):
            rows.append(future.result())
    wall = time.monotonic() - started
    calls = [row for row in rows]
    throttled = sum(1 for row in calls if row["throttled"])
    priced = list(calls)
    if warmup_row is not None:
        priced.append(warmup_row)
    return {
        "name": name,
        "concurrency": concurrency,
        "cacheSystem": cache,
        "wallSeconds": round(wall, 3),
        "timeToFirstFileSeconds": round(holder["at"] - started, 3) if holder.get("at") else None,
        "calls": len(calls),
        "ok": sum(1 for row in calls if row["ok"]),
        "throttled": throttled,
        "throttleRate": round(throttled / len(calls), 3) if calls else 0,
        "costUsd": round(sum(_cost(row) for row in priced), 6),
        "costUsdIfPrefixUncached": round(sum(_uncached_cost(row) for row in priced), 6),
        "warmup": {key: value for key, value in (warmup_row or {}).items() if key != "text"},
        "rows": [{key: value for key, value in row.items() if key != "text"} for row in rows],
        "_files": {row["path"]: row["text"] for row in rows if row["ok"] and row["text"]},
    }


def main() -> None:
    blueprint = json.loads(BLUEPRINT.read_text(encoding="utf-8"))
    levels = [
        _level("c4", 4, False, False),
        _level("c8", 8, False, False),
        _level("c12", 12, False, False),
        _level("c8-cache", 8, True, True),
    ]
    best = max(levels, key=lambda level: (level["ok"], -level["wallSeconds"]))
    APP.mkdir(parents=True, exist_ok=True)
    for path, body in SCAFFOLD.items():
        target = APP / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")
    for path, body in best["_files"].items():
        target = APP / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")
    public = []
    for level in levels:
        files = level.pop("_files")
        level["filesWritten"] = sorted(files) if level is best else []
        public.append(level)
    summary = {
        "blueprintSession": blueprint.get("sessionId"),
        "blueprintFiles": len(blueprint.get("files") or []),
        "tasks": len(TASKS),
        "sharedContractChars": len(SHARED),
        "model": bedrock_model(),
        "maxTokensPerFile": 2000,
        "assembledFrom": best["name"],
        "levels": public,
    }
    OUT.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({
        "out": str(OUT),
        "assembledFrom": best["name"],
        "levels": [
            {k: level[k] for k in ("name", "wallSeconds", "timeToFirstFileSeconds", "ok", "throttleRate", "costUsd")}
            for level in public
        ],
    }, indent=2))


if __name__ == "__main__":
    main()
