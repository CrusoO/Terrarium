"""Read Bedrock quotas or throttle metrics. Print the denial if access is missing."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path[:0] = ["/app/packages/agents", "/app/packages/py-contracts"]
import terrarium_agents.llm  # noqa: F401  — installs the corporate CA bundle

import boto3
from botocore.exceptions import ClientError

REGION = "eu-central-1"


def main() -> None:
    out: dict = {"region": REGION}
    try:
        quotas = boto3.client("service-quotas", region_name=REGION)
        response = quotas.list_service_quotas(ServiceCode="bedrock")
        rows = []
        for item in response.get("Quotas") or []:
            name = str(item.get("QuotaName") or "")
            if any(word in name.lower() for word in ("token", "request", "invoke", "claude", "anthropic")):
                rows.append({"name": name, "value": item.get("Value")})
        out["quotas"] = rows[:40]
        out["quotaCount"] = len(rows)
    except ClientError as exc:
        out["quotasError"] = exc.response.get("Error", {}).get("Code", str(exc))
    try:
        cw = boto3.client("cloudwatch", region_name=REGION)
        listed = cw.list_metrics(Namespace="AWS/Bedrock", MetricName="InvocationThrottles")
        out["throttleMetrics"] = len(listed.get("Metrics") or [])
    except ClientError as exc:
        out["cloudwatchError"] = exc.response.get("Error", {}).get("Code", str(exc))
    print(json.dumps(out))


if __name__ == "__main__":
    main()
