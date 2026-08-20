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
IntentPhase = Literal["greeting", "clarify", "ready"]


class ConversationTurn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    text: str


class Intent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: IntentKind
    stack: Stack
    summary: str
    toolId: str | None = None


class IntentAgentInput(BaseModel):
    """Fields already frozen on AgentJob / Intent, plus optional chat history."""

    model_config = ConfigDict(extra="forbid")

    prompt: str
    sessionId: str | None = None
    files: FileMap | None = None
    toolId: str | None = None
    conversation: list[ConversationTurn] | None = None


class IntentAgentOutput(BaseModel):
    """Intent plus chat-only fields. Other agents must parse Intent, not this."""

    model_config = ConfigDict(extra="forbid")

    kind: IntentKind
    stack: Stack
    summary: str
    toolId: str | None = None
    phase: IntentPhase = "ready"
    reply: str | None = None
    questions: list[str] | None = None

    def as_intent(self) -> Intent:
        return Intent(
            kind=self.kind,
            stack=self.stack,
            summary=self.summary,
            toolId=self.toolId,
        )


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
    sessionId: str | None = None


class CreateSessionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str


class SandboxReadyPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    previewUrl: str
    containerId: str


class PreviewReadyPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    previewUrl: str


class SandboxHandle(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str
    previewUrl: str
    containerId: str


class HealthReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: RuntimeStatus
    logs: str
