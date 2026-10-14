from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

DEV_USER = "dev-user"  # Test-only fallback after P6-S1


# ── P6-S1 Auth ──────────────────────────────────────────────────────────────

class User(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    email: str  # Firebase UID email


class AuthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user: User

Stack = Literal["react", "fullstack"]
FrontendStack = Literal["vanilla", "react"]
BackendNeed = Literal["auto", "yes", "no"]
BackendStack = Literal["none", "node-express"]
IntentKind = Literal["new", "modify"]
ToolRole = Literal["owner", "editor", "viewer"]
ToolVisibility = Literal["all", "group", "private"]
RuntimeStatus = Literal["booting", "running", "unhealthy", "sleeping", "stopped"]
SessionEventName = Literal[
    "session.created",
    "smartmatch.hit",
    "smartmatch.miss",
    "intent.classified",
    "codegen.started",
    "codegen.completed",
    "codegen.retry",
    "editor.started",
    "editor.completed",
    "edit.verified",
    "blocked by security gate",
    "heal.skipped",
    "sandbox.booting",
    "sandbox.ready",
    "sandbox.unhealthy",
    "heal.attempt",
    "heal.exhausted",
    "preview.stream.started",
    "preview.stream.file",
    "preview.stream.completed",
    "preview.ready",
    "check.started",
    "check.step",
    "check.completed",
    "publish.blocked",
    "vuln.detected",
    "vuln.remediation.attempt",
    "vuln.remediated",
    "vuln.suppressed",
    "vuln.escalated",
    "vuln.campaign.progress",
    "change.queued",
    "change.claimed",
    "change.tests_proposed",
    "change.tests_approved",
    "change.ready",
    "change.published",
    "change.failed",
]

VulnSource = Literal["osv", "semgrep", "gitleaks", "trivy", "attack"]
Severity = Literal["low", "medium", "high", "critical"]
HealthStatus = Literal["checking", "healthy", "warning", "unsafe", "stale"]
CheckStep = Literal[
    "tests",
    "regression",
    "dependencies",
    "code",
    "secrets",
    "image",
    "attacks",
]
RemediationStrategy = Literal[
    "patch_upgrade",
    "code_fix",
    "major_upgrade",
    "replace_package",
    "remove_dependency",
    "suppress",
    "contain",
]
LedgerEntryKind = Literal[
    "detected",
    "attempt",
    "fixed",
    "suppressed",
    "reopened",
    "escalated",
    "contained",
]
ChangeChannel = Literal["whatsapp", "slack", "teams", "email", "web"]
ChangeRequestStatus = Literal[
    "received",
    "queued",
    "claimed",
    "awaiting_test_approval",
    "building",
    "verifying",
    "ready_for_review",
    "published",
    "failed",
    "rejected",
    "expired",
    "cancelled",
]

FileMap = dict[str, str]
IntentPhase = Literal["greeting", "clarify", "ready"]


class ConversationTurn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    text: str


class AcceptanceCheck(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    description: str
    steps: list[str] | None = None


class AcceptanceCheckResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    checkId: str
    status: Literal["passed", "failed", "skipped"]
    screenshotUrl: str | None = None
    error: str | None = None
    durationMs: int | None = None


class Intent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: IntentKind
    stack: Stack
    summary: str
    toolId: str | None = None
    frontendStack: FrontendStack | None = None
    backendStack: BackendStack | None = None
    acceptanceChecks: list[AcceptanceCheck] | None = None


class IntentAgentInput(BaseModel):
    """Fields already frozen on AgentJob / Intent, plus optional chat history."""

    model_config = ConfigDict(extra="forbid")

    prompt: str
    sessionId: str | None = None
    files: FileMap | None = None
    toolId: str | None = None
    conversation: list[ConversationTurn] | None = None
    frontendStack: FrontendStack | None = None
    backendNeed: BackendNeed | None = None
    backendStack: BackendStack | None = None


class ClarifyChoice(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    subtitle: str
    value: str
    variant: Literal["default", "upload", "custom"] | None = None


class ClarifyQuestion(BaseModel):
    """Clarify prompt with quick-pick options (UI always allows custom text)."""

    model_config = ConfigDict(extra="forbid")

    text: str
    helperText: str | None = None
    allowMultiple: bool = False
    inputPlaceholder: str | None = None
    acceptsFiles: bool = False
    options: list[str] | None = Field(default=None, min_length=3, max_length=6)
    choices: list[ClarifyChoice] | None = Field(default=None, min_length=3, max_length=6)
    dataSource: bool = False


class IntentAgentOutput(BaseModel):
    """Intent plus chat-only fields. Other agents must parse Intent, not this."""

    model_config = ConfigDict(extra="forbid")

    kind: IntentKind
    stack: Stack
    summary: str
    toolId: str | None = None
    frontendStack: FrontendStack | None = None
    backendStack: BackendStack | None = None
    acceptanceChecks: list[AcceptanceCheck] | None = None
    phase: IntentPhase = "ready"
    reply: str | None = None
    questions: list[str] | None = None
    questionItems: list[ClarifyQuestion] | None = None

    def as_intent(self) -> Intent:
        return Intent(
            kind=self.kind,
            stack=self.stack,
            summary=self.summary,
            toolId=self.toolId,
            frontendStack=self.frontendStack,
            backendStack=self.backendStack,
            acceptanceChecks=self.acceptanceChecks,
        )


class ErrorContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    logs: str
    health: RuntimeStatus
    healAttempt: int | None = Field(default=None, ge=0, le=3)


class AgentJob(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str
    intent: Intent
    prompt: str
    files: FileMap | None = None
    errorContext: ErrorContext | None = None
    frontendStack: FrontendStack | None = None
    backendNeed: BackendNeed | None = None
    backendStack: BackendStack | None = None


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
    frontendStack: FrontendStack | None = None
    backendNeed: BackendNeed | None = None
    backendStack: BackendStack | None = None


class CreateSessionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str


class SessionFilesResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    files: FileMap


class SandboxReadyPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    previewUrl: str
    containerId: str


class PreviewReadyPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    previewUrl: str


class PreviewStreamFilePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    path: str
    content: str
    files: FileMap | None = None
    complete: bool | None = None


class RuntimeErrorRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str
    source: Literal["frontend", "backend"] = "frontend"
    stack: str | None = None
    filename: str | None = None
    lineno: int | None = None
    colno: int | None = None
    recentChange: str | None = None


class SandboxHandle(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str
    previewUrl: str
    containerId: str


class HealthReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: RuntimeStatus
    logs: str


class Tool(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    ownerId: str
    ownerEmail: str | None = None
    name: str
    summary: str
    status: RuntimeStatus
    visibility: ToolVisibility = "private"
    groupId: str | None = None
    groupName: str | None = None
    myRole: ToolRole | None = None
    autoApproveTests: bool | None = None
    draftVersionId: str | None = None
    createdAt: str
    updatedAt: str
    latestVersionId: str | None = None
    latestSessionId: str | None = None


class ToolMember(BaseModel):
    model_config = ConfigDict(extra="forbid")

    toolId: str
    userId: str
    role: ToolRole


class ToolMembersResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    members: list[ToolMember]


class ShareToolRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    emailOrUserId: str
    role: Literal["editor", "viewer"]


class ToolVersion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    toolId: str
    versionNumber: int
    prompt: str
    summary: str
    fileCount: int
    createdAt: str


class ToolSummary(Tool):
    model_config = ConfigDict(extra="forbid")

    fileCount: int


class PublishToolRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    summary: str | None = None
    visibility: Literal["all", "group"] = "all"
    groupId: str | None = None
    groupName: str | None = None
    acknowledgeWarnings: bool | None = None
    versionId: str | None = None

    @model_validator(mode="after")
    def group_required_for_group_visibility(self) -> PublishToolRequest:
        if self.visibility == "group" and not (self.groupId or "").strip():
            raise ValueError("groupId is required when visibility is group")
        return self


class PublishToolResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tool: ToolSummary
    version: ToolVersion


class WorkspaceToolsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tools: list[ToolSummary]


class OpenToolResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str
    previewUrl: str
    tool: ToolSummary
    role: ToolRole


class ToolIndexRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    toolId: str
    stack: Stack
    summary: str
    promptFingerprint: str
    createdAt: str
    updatedAt: str


class SmartMatchResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hit: bool
    toolId: str | None = None
    score: float | None = Field(default=None, ge=0, le=1)
    matchedTool: Tool | None = None


class AcceptMatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str
    toolId: str


class GitHubStatusResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    configured: bool
    connected: bool
    login: str | None = None
    repo: str | None = None
    htmlUrl: str | None = None


class GitHubPushRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sessionId: str
    repoName: str | None = None
    message: str | None = None
    description: str | None = None
    private: bool | None = None


class GitHubPushResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    htmlUrl: str
    repo: str
    created: bool


class VulnerabilityFinding(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    toolId: str
    versionId: str
    source: VulnSource
    severity: Severity
    title: str
    advisoryId: str | None = None
    packageName: str | None = None
    installedVersion: str | None = None
    fixedVersions: list[str] | None = None
    file: str | None = None
    rule: str | None = None
    reachable: bool | None = None
    detectedAt: str


class ToolHealthTests(BaseModel):
    model_config = ConfigDict(extra="forbid")

    passed: int
    total: int
    failedIds: list[str]


class ToolHealthAttacks(BaseModel):
    model_config = ConfigDict(extra="forbid")

    attempted: int
    succeeded: int
    notApplicable: list[str]


class ToolHealthVulnerabilities(BaseModel):
    model_config = ConfigDict(extra="forbid")

    critical: int
    high: int
    medium: int
    low: int


class ToolHealth(BaseModel):
    model_config = ConfigDict(extra="forbid")

    toolId: str
    versionId: str
    fileMapHash: str
    vulnDbVersion: str
    status: HealthStatus
    checkedAt: str
    tests: ToolHealthTests
    attacks: ToolHealthAttacks
    vulnerabilities: ToolHealthVulnerabilities
    secretsFound: int
    codeIssues: int
    activeSuppressions: int
    blockingReasons: list[str]
    warnings: list[str]


class RemediationAttempt(BaseModel):
    model_config = ConfigDict(extra="forbid")

    findingId: str
    strategy: RemediationStrategy
    attempt: int
    draftVersionId: str | None = None
    checksPassed: int | None = None
    checksTotal: int | None = None
    rescanClean: bool | None = None
    outcome: Literal["fixed", "failed", "needs_approval"]


class Suppression(BaseModel):
    model_config = ConfigDict(extra="forbid")

    findingId: str
    reason: str
    evidence: str | None = None
    approvedBy: str
    expiresAt: str


class RemediationCampaign(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    advisoryId: str
    toolIds: list[str]
    canaryToolId: str
    fixed: int
    failed: int
    pendingApproval: int


class LedgerEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    toolId: str
    at: str
    kind: LedgerEntryKind
    findingId: str | None = None
    detail: str


class ChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    channel: ChangeChannel
    externalMessageId: str
    actorId: str
    toolId: str | None = None
    text: str
    status: ChangeRequestStatus
    sessionId: str | None = None
    draftVersionId: str | None = None
    proposedChecks: list[AcceptanceCheck] | None = None
    leaseOwner: str | None = None
    leaseExpiresAt: str | None = None
    createdAt: str
    updatedAt: str


class ChannelLink(BaseModel):
    model_config = ConfigDict(extra="forbid")

    actorId: str
    channel: ChangeChannel
    address: str
    verifiedAt: str


class CheckStepPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    step: CheckStep
    status: Literal["running", "passed", "failed", "skipped"]
    detail: str | None = None


class CheckCompletedPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    health: ToolHealth


class PublishBlockedPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    blockingReasons: list[str]


class ToolHealthResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    live: ToolHealth | None = None
    draft: ToolHealth | None = None


class LedgerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entries: list[LedgerEntry]


class PublishBlockedResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    blockingReasons: list[str]
    health: ToolHealth


class WhatsAppLinkCodeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    expiresAt: str
