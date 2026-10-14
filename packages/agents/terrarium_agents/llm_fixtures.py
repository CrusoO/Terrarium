"""Record/replay at the Bedrock boundary.

CODEGEN_LLM_MODE:
  replay          default; a missing fixture is an error; spend stays $0
  record-missing  replay when the hash exists, otherwise call and store
  live            always call; store the response; honour CODEGEN_MAX_SPEND_USD

A fixture is keyed by sha256 of (provider, model id, system, user, params).
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

MODES = ("replay", "record-missing", "live")
_LIVE = object()

_spend = {"usd": 0.0, "calls": 0, "byTask": {}}
_avoided = {"usd": 0.0, "calls": 0}
_repairs: list[tuple[str, int]] = []
_cache_reads: list[int] = []
_stats = {"replayHits": 0, "liveCalls": 0}
_provider: Any = None


class MissingFixture(RuntimeError):
    def __init__(self, digest: str) -> None:
        super().__init__(f"no fixture for {digest}; CODEGEN_LLM_MODE=replay refuses a live call")
        self.digest = digest


class SpendExceeded(RuntimeError):
    def __init__(self, spent: float, cap: float) -> None:
        super().__init__(f"codegen spend ${spent:.4f} would exceed CODEGEN_MAX_SPEND_USD=${cap:.4f}")
        self.spent = spent
        self.cap = cap


def llm_mode() -> str:
    raw = (os.environ.get("CODEGEN_LLM_MODE") or "replay").strip().lower()
    return raw if raw in MODES else "replay"


def fixtures_root() -> Path:
    override = (os.environ.get("CODEGEN_FIXTURES_DIR") or "").strip()
    if override:
        return Path(override)
    here = Path(__file__).resolve()
    return here.parents[3] / "docs" / "codegen-metrics" / "fixtures"


def request_hash(provider: str, model: str, system: str, user: str, params: dict[str, Any]) -> str:
    payload = json.dumps(
        {
            "provider": provider,
            "model": model,
            "system": system,
            "user": user,
            "params": params,
        },
        sort_keys=True,
        ensure_ascii=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def stream_params(*, max_tokens: int, cache_system: bool, purpose: str) -> dict[str, Any]:
    return {"maxTokens": int(max_tokens), "cacheSystem": bool(cache_system), "purpose": purpose}


def invoke_params(*, max_tokens: int, temperature: float, purpose: str) -> dict[str, Any]:
    return {"maxTokens": int(max_tokens), "temperature": temperature, "purpose": purpose}


def estimate_usd(
    model: str,
    input_tokens: int | None,
    output_tokens: int | None,
    cache_write: int | None = 0,
    cache_read: int | None = 0,
) -> float:
    """Same formula as per_file.call_cost. Haiku $1/$5, otherwise Sonnet $3/$15 per million."""
    name = (model or "").lower()
    input_usd, output_usd = (1.0, 5.0) if "haiku" in name else (3.0, 15.0)
    return (
        (input_tokens or 0) * input_usd
        + (cache_write or 0) * input_usd * 1.25
        + (cache_read or 0) * input_usd * 0.1
        + (output_tokens or 0) * output_usd
    ) / 1_000_000


def max_spend() -> float | None:
    raw = (os.environ.get("CODEGEN_MAX_SPEND_USD") or "").strip()
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def reset_run() -> None:
    _spend["usd"] = 0.0
    _spend["calls"] = 0
    _spend["byTask"] = {}
    _avoided["usd"] = 0.0
    _avoided["calls"] = 0
    _repairs.clear()
    _cache_reads.clear()
    _stats["replayHits"] = 0
    _stats["liveCalls"] = 0


def spend_summary() -> dict[str, Any]:
    return {
        "usd": round(_spend["usd"], 6),
        "calls": _spend["calls"],
        "byTask": {
            task: {"usd": round(bucket["usd"], 6), "calls": bucket["calls"]}
            for task, bucket in _spend["byTask"].items()
        },
        "avoidedUsd": round(_avoided["usd"], 6),
        "replayCalls": _avoided["calls"],
        "cacheReadTokens": sum(_cache_reads),
        "replayHits": _stats["replayHits"],
        "liveCalls": _stats["liveCalls"],
        "repairAverage": repair_average(),
    }


def note_repair(app: str, count: int) -> None:
    _repairs.append((app, int(count)))


def repair_average() -> float:
    if not _repairs:
        return 0.0
    return sum(count for _app, count in _repairs) / len(_repairs)


def assert_repair_budget(limit: float = 2.0) -> None:
    average = repair_average()
    if average > limit:
        raise RuntimeError(f"repairs per app averaged {average:.2f}, above {limit:.0f}")


def install_provider(provider: Any) -> None:
    global _provider
    _provider = provider


def is_live(value: Any) -> bool:
    return value is _LIVE


def _record_path(digest: str) -> Path:
    return fixtures_root() / "records" / f"{digest}.json"


def load_record(digest: str) -> dict[str, Any] | None:
    path = _record_path(digest)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def save_record(record: dict[str, Any], *, force: bool = False) -> Path:
    path = _record_path(str(record["hash"]))
    path.parent.mkdir(parents=True, exist_ok=True)
    # record-missing keeps an existing response. A changed prompt is a new hash.
    if path.is_file() and not force and llm_mode() == "record-missing":
        return path
    path.write_text(json.dumps(record, indent=2), encoding="utf-8")
    return path


def _charge(task: str, usd: float) -> None:
    _spend["usd"] += usd
    _spend["calls"] += 1
    bucket = _spend["byTask"].setdefault(task, {"usd": 0.0, "calls": 0})
    bucket["usd"] += usd
    bucket["calls"] += 1
    cap = max_spend()
    if cap is not None and _spend["usd"] > cap + 1e-9:
        raise SpendExceeded(_spend["usd"], cap)


def _guard_before(model: str, system: str, user: str, max_tokens: int, task: str) -> None:
    """Refuse the call when a conservative estimate would cross the cap."""
    cap = max_spend()
    if cap is None or llm_mode() == "replay":
        return
    projected = _spend["usd"] + estimate_usd(model, (len(system) + len(user)) // 4, min(max_tokens, 2000))
    if projected > cap + 1e-9:
        raise SpendExceeded(projected, cap)
    _ = task


def _remember(record: dict[str, Any], *, task: str) -> None:
    usd = estimate_usd(
        str(record.get("model") or ""),
        record.get("inputTokens"),
        record.get("outputTokens"),
        record.get("cacheCreationInputTokens"),
        record.get("cacheReadInputTokens"),
    )
    record["estimatedUsd"] = round(usd, 6)
    if llm_mode() == "replay":
        _avoided["usd"] += usd
        _avoided["calls"] += 1
        _stats["replayHits"] += 1
        _cache_reads.append(int(record.get("cacheReadInputTokens") or 0))
        return
    _stats["liveCalls"] += 1
    _charge(task, usd)
    _cache_reads.append(int(record.get("cacheReadInputTokens") or 0))
    if llm_mode() in {"live", "record-missing"}:
        save_record(record)


def _stream_from_record(record: dict[str, Any]):
    from terrarium_agents.llm_stream import StreamResult

    _remember(record, task=str(record.get("purpose") or "codegen"))
    return StreamResult(
        text=str(record.get("text") or ""),
        provider=str(record.get("provider") or "bedrock"),
        model=str(record.get("model") or ""),
        ok=bool(record.get("ok", True)),
        fail_reason=record.get("failReason"),
        time_to_first_token_s=record.get("timeToFirstTokenSeconds"),
        duration_s=float(record.get("latencySeconds") or 0.0),
        input_tokens=record.get("inputTokens"),
        output_tokens=record.get("outputTokens"),
        usage_source="fixture",
        stop_reason=record.get("stopReason"),
        cache_creation_input_tokens=record.get("cacheCreationInputTokens"),
        cache_read_input_tokens=record.get("cacheReadInputTokens"),
    )


def resolve_stream(
    system: str,
    user: str,
    model: str,
    *,
    purpose: str = "codegen",
    max_tokens: int = 16000,
    cache_system: bool = False,
):
    """Return a StreamResult, or _LIVE when the caller should hit Bedrock."""
    if _provider is not None:
        result = _provider.stream(
            system,
            user,
            model,
            purpose=purpose,
            max_tokens=max_tokens,
            cache_system=cache_system,
        )
        _stats["replayHits"] += 1
        _cache_reads.append(int(getattr(result, "cache_read_input_tokens", 0) or 0))
        return result
    params = stream_params(max_tokens=max_tokens, cache_system=cache_system, purpose=purpose)
    digest = request_hash("bedrock", model, system, user, params)
    record = load_record(digest)
    mode = llm_mode()
    if record is not None and mode in {"replay", "record-missing"}:
        return _stream_from_record(record)
    if mode == "replay":
        raise MissingFixture(digest)
    _guard_before(model, system, user, max_tokens, purpose)
    return _LIVE


def remember_stream(
    system: str,
    user: str,
    model: str,
    result: Any,
    *,
    purpose: str,
    max_tokens: int,
    cache_system: bool,
) -> None:
    params = stream_params(max_tokens=max_tokens, cache_system=cache_system, purpose=purpose)
    digest = request_hash("bedrock", result.model or model, system, user, params)
    # Also file the requested model id so a regional alias still replays.
    requested = request_hash("bedrock", model, system, user, params)
    record = {
        "hash": requested,
        "provider": "bedrock",
        "model": model,
        "resolvedModel": result.model,
        "params": params,
        "purpose": purpose,
        "text": result.text or "",
        "ok": bool(result.ok),
        "failReason": result.fail_reason,
        "inputTokens": result.input_tokens,
        "outputTokens": result.output_tokens,
        "cacheCreationInputTokens": result.cache_creation_input_tokens,
        "cacheReadInputTokens": result.cache_read_input_tokens,
        "latencySeconds": round(float(result.duration_s or 0.0), 3),
        "timeToFirstTokenSeconds": result.time_to_first_token_s,
        "stopReason": result.stop_reason,
        "aliasHash": digest,
    }
    _remember(record, task=purpose)


def resolve_invoke(
    system: str,
    user: str,
    model: str,
    *,
    max_tokens: int,
    temperature: float,
    purpose: str = "repair",
):
    if _provider is not None:
        _stats["replayHits"] += 1
        return _provider.invoke(
            system,
            user,
            model,
            max_tokens=max_tokens,
            temperature=temperature,
            purpose=purpose,
        )
    params = invoke_params(max_tokens=max_tokens, temperature=temperature, purpose=purpose)
    digest = request_hash("bedrock", model, system, user, params)
    record = load_record(digest)
    mode = llm_mode()
    if record is not None and mode in {"replay", "record-missing"}:
        _remember(record, task=purpose)
        return {
            "ok": bool(record.get("ok", True)),
            "text": record.get("text") or "",
            "model": record.get("model") or model,
            "durationSeconds": record.get("latencySeconds") or 0,
            "inputTokens": record.get("inputTokens"),
            "outputTokens": record.get("outputTokens"),
            "failReason": record.get("failReason"),
        }
    if mode == "replay":
        raise MissingFixture(digest)
    _guard_before(model, system, user, max_tokens, purpose)
    return _LIVE


def remember_invoke(
    system: str,
    user: str,
    model: str,
    result: dict[str, Any],
    *,
    max_tokens: int,
    temperature: float,
    purpose: str,
) -> None:
    params = invoke_params(max_tokens=max_tokens, temperature=temperature, purpose=purpose)
    digest = request_hash("bedrock", model, system, user, params)
    record = {
        "hash": digest,
        "provider": "bedrock",
        "model": model,
        "params": params,
        "purpose": purpose,
        "text": result.get("text") or "",
        "ok": bool(result.get("ok")),
        "failReason": result.get("failReason"),
        "inputTokens": result.get("inputTokens"),
        "outputTokens": result.get("outputTokens"),
        "cacheCreationInputTokens": 0,
        "cacheReadInputTokens": 0,
        "latencySeconds": result.get("durationSeconds") or 0,
    }
    _remember(record, task=purpose)


def write_fixture(
    *,
    provider: str,
    model: str,
    system: str,
    user: str,
    params: dict[str, Any],
    text: str,
    input_tokens: int,
    output_tokens: int,
    latency_seconds: float,
    cache_read: int = 0,
    purpose: str = "codegen",
    app: str = "",
    role: str = "",
    path: str = "",
    ok: bool = True,
    force: bool = False,
) -> str:
    digest = request_hash(provider, model, system, user, params)
    if not force and load_record(digest) is not None:
        return digest
    save_record(
        {
            "hash": digest,
            "provider": provider,
            "model": model,
            "params": params,
            "purpose": purpose,
            "text": text,
            "ok": ok,
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "cacheCreationInputTokens": 0,
            "cacheReadInputTokens": cache_read,
            "latencySeconds": round(latency_seconds, 3),
            "stopReason": "end_turn",
            "app": app,
            "role": role,
            "path": path,
            "estimatedUsd": round(
                estimate_usd(model, input_tokens, output_tokens, 0, cache_read),
                6,
            ),
        },
        force=force,
    )
    return digest
