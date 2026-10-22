from __future__ import annotations

import json
from pathlib import Path

from terrarium_contracts import (
    AcceptanceCheck,
    AcceptanceCheckResult,
    ChangeRequest,
    ChannelLink,
    CheckCompletedPayload,
    CheckStepPayload,
    LedgerEntry,
    PublishBlockedPayload,
    RemediationAttempt,
    RemediationCampaign,
    Suppression,
    ToolHealth,
    VulnerabilityFinding,
)

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "phase7-roundtrip.json"


def test_phase7_contract_roundtrip() -> None:
    raw = json.loads(FIXTURE.read_text(encoding="utf-8"))
    AcceptanceCheck.model_validate(raw["acceptanceCheck"])
    AcceptanceCheckResult.model_validate(raw["acceptanceCheckResult"])
    VulnerabilityFinding.model_validate(raw["vulnerabilityFinding"])
    ToolHealth.model_validate(raw["toolHealth"])
    RemediationAttempt.model_validate(raw["remediationAttempt"])
    Suppression.model_validate(raw["suppression"])
    RemediationCampaign.model_validate(raw["remediationCampaign"])
    LedgerEntry.model_validate(raw["ledgerEntry"])
    ChangeRequest.model_validate(raw["changeRequest"])
    ChannelLink.model_validate(raw["channelLink"])
    CheckStepPayload.model_validate(raw["checkStepPayload"])
    CheckCompletedPayload.model_validate(raw["checkCompletedPayload"])
    PublishBlockedPayload.model_validate(raw["publishBlockedPayload"])
