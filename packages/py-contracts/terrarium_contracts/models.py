from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

DEV_USER = "dev-user"

Stack = Literal["react", "fullstack"]
IntentKind = Literal["new", "modify"]
ToolRole = Literal["owner", "editor", "viewer"]
RuntimeStatus = Literal["booting", "running", "unhealthy", "sleeping", "stopped"]
SessionEventName = Literal[
    "session.created",
    "smartmatch.hit",
    "smartmatch.miss",
    "intent.classified",
    "codegen.started",
    "codegen.completed",
    "editor.started",
    "editor.completed",
    "sandbox.booting",
    "sandbox.ready",
    "sandbox.unhealthy",
    "heal.attempt",
    "heal.exhausted",
    "preview.ready",
]

FileMap = dict[str, str]


class Intent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: IntentKind
    stack: Stack
    summary: str
    toolId: str | None = None


class ErrorContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    logs: str
    health: RuntimeStatus


class AgentJob(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str
    intent: Intent
    prompt: str
    files: FileMap | None = None
    errorContext: ErrorContext | None = None


class AgentResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    files: FileMap
    commitMessage: str


class SessionEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: SessionEventName
    sessionId: str
    at: str
    payload: dict[str, Any] | None = None


class CreateSessionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str


class CreateSessionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str


class SandboxHandle(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str
    previewUrl: str
    containerId: str


class HealthReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: RuntimeStatus
    logs: str
