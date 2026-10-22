"""Prepare-only Bedrock Priority vs Standard A/B. Do not run until approved.

10 calls each tier. Prints estimated cost from published Sonnet 4.6 on-demand
rates (input $3 / MTok, output $15 / MTok). Priority is typically a premium;
this script records the tier requested and the usage returned, and applies a
1.0x multiplier for standard and leaves priority multiplier as PRIORITY_COST_MULTIPLIER
(default 1.0 until AWS invoice confirms the premium — set the env when known).
"""

from __future__ import annotations

import json
import os
import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages" / "agents"))
import terrarium_agents.llm  # noqa: E402,F401  loads .env

INPUT_USD_PER_MTOK = 3.0
OUTPUT_USD_PER_MTOK = 15.0
CALLS = 10
PROMPT = "Reply with the single word pong."


def _cost(input_tokens: int, output_tokens: int, multiplier: float) -> float:
    return (
        (input_tokens / 1_000_000) * INPUT_USD_PER_MTOK
        + (output_tokens / 1_000_000) * OUTPUT_USD_PER_MTOK
    ) * multiplier


def main() -> None:
    raise SystemExit(
        "Priority tier is unsupported for eu.anthropic.claude-sonnet-4-6 and stays "
        "parked until the validated preview rate is at least 90%. This script does not call Bedrock."
    )
    import boto3

    region = os.environ.get("AWS_REGION", "eu-central-1")
    model = os.environ.get("BEDROCK_MODEL", "eu.anthropic.claude-sonnet-4-6")
    client = boto3.client("bedrock-runtime", region_name=region)
    priority_mult = float(os.environ.get("PRIORITY_COST_MULTIPLIER", "1.0"))
    rows = []
    wanted = {part.strip() for part in os.environ.get("AB_TIERS", "default,priority").split(",") if part.strip()}
    for tier, mult in (("default", 1.0), ("priority", priority_mult)):
        if tier not in wanted:
            continue
        for index in range(1, CALLS + 1):
            started = time.monotonic()
            body = json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 32,
                    "temperature": 0,
                    "messages": [{"role": "user", "content": PROMPT}],
                }
            )
            kwargs = {
                "modelId": model,
                "contentType": "application/json",
                "accept": "application/json",
                "body": body,
            }
            if tier != "default":
                kwargs["serviceTier"] = tier
            try:
                response = client.invoke_model(**kwargs)
            except Exception as error:
                rows.append(
                    {
                        "tier": tier,
                        "index": index,
                        "seconds": round(time.monotonic() - started, 3),
                        "error": f"{type(error).__name__}: {error}",
                        "estimatedUsd": 0.0,
                    }
                )
                continue
            raw = json.loads(response["body"].read())
            usage = raw.get("usage") or {}
            input_tokens = int(usage.get("input_tokens") or 0)
            output_tokens = int(usage.get("output_tokens") or 0)
            rows.append(
                {
                    "tier": tier,
                    "index": index,
                    "seconds": round(time.monotonic() - started, 3),
                    "inputTokens": input_tokens,
                    "outputTokens": output_tokens,
                    "estimatedUsd": round(_cost(input_tokens, output_tokens, mult), 6),
                }
            )
    out = {
        "rates": {"inputUsdPerMtok": INPUT_USD_PER_MTOK, "outputUsdPerMtok": OUTPUT_USD_PER_MTOK},
        "priorityCostMultiplier": priority_mult,
        "rows": rows,
        "totalEstimatedUsd": round(sum(row["estimatedUsd"] for row in rows), 6),
    }
    path = Path(os.environ.get("PRIORITY_AB_OUT", "docs/codegen-metrics/priority-ab.json"))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
