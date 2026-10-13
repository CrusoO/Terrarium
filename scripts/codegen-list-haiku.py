"""List Anthropic inference profiles this account can see. Measurement helper."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages" / "agents"))
import terrarium_agents.llm  # noqa: E402,F401

import boto3
from terrarium_agents.llm import bedrock_region

client = boto3.client("bedrock", region_name=bedrock_region())
rows = []
token = None
while True:
    kwargs = {}
    if token:
        kwargs["nextToken"] = token
    page = client.list_inference_profiles(**kwargs)
    for item in page.get("inferenceProfileSummaries", []):
        name = str(item.get("inferenceProfileId") or item.get("inferenceProfileName") or "")
        if "anthropic" in name.lower() or "claude" in name.lower():
            rows.append(name)
    token = page.get("nextToken")
    if not token:
        break
print(json.dumps(rows, indent=2))
