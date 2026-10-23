import { z } from "zod";

/** Until P6-S1, every actor is this stub. */
export const DEV_USER = "dev-user" as const;

export const stackSchema = z.enum(["react", "fullstack"]);
export type Stack = z.infer<typeof stackSchema>;

export const frontendStackSchema = z.enum(["vanilla", "react", "angular", "sapui5"]);
export type FrontendStack = z.infer<typeof frontendStackSchema>;

export const backendNeedSchema = z.enum(["auto", "yes", "no"]);
export type BackendNeed = z.infer<typeof backendNeedSchema>;

export const backendStackSchema = z.enum(["none", "node-express", "angular-express", "sap-cap"]);
export type BackendStack = z.infer<typeof backendStackSchema>;

export const intentKindSchema = z.enum(["new", "modify"]);
export type IntentKind = z.infer<typeof intentKindSchema>;

export const toolRoleSchema = z.enum(["owner", "editor", "viewer"]);
export type ToolRole = z.infer<typeof toolRoleSchema>;

export const toolVisibilitySchema = z.enum(["all", "group", "private"]);
export type ToolVisibility = z.infer<typeof toolVisibilitySchema>;

export const runtimeStatusSchema = z.enum([
  "booting",
  "running",
  "unhealthy",
  "sleeping",
  "stopped",
]);
export type RuntimeStatus = z.infer<typeof runtimeStatusSchema>;

export const sessionEventNameSchema = z.enum([
  "session.created",
  "smartmatch.hit",
  "smartmatch.miss",
  "intent.classified",
  "codegen.started",
  "codegen.completed",
  "codegen.retry",
  "editor.started",
  "editor.completed",
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
]);
export type SessionEventName = z.infer<typeof sessionEventNameSchema>;

/** path → file contents */
export const fileMapSchema = z.record(z.string());
export type FileMap = z.infer<typeof fileMapSchema>;

export const intentPhaseSchema = z.enum(["greeting", "clarify", "ready"]);
export type IntentPhase = z.infer<typeof intentPhaseSchema>;

export const conversationTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string(),
});
export type ConversationTurn = z.infer<typeof conversationTurnSchema>;

export const acceptanceCheckSchema = z.object({
  id: z.string(),
  description: z.string(),
  steps: z.array(z.string()).optional(),
});
export type AcceptanceCheck = z.infer<typeof acceptanceCheckSchema>;

export const acceptanceCheckResultSchema = z.object({
  checkId: z.string(),
  status: z.enum(["passed", "failed", "skipped"]),
  screenshotUrl: z.string().optional(),
  error: z.string().optional(),
  durationMs: z.number().optional(),
});
export type AcceptanceCheckResult = z.infer<typeof acceptanceCheckResultSchema>;

export const intentSchema = z.object({
  kind: intentKindSchema,
  stack: stackSchema,
  summary: z.string(),
  toolId: z.string().optional(),
  frontendStack: frontendStackSchema.optional(),
  backendStack: backendStackSchema.optional(),
  acceptanceChecks: z.array(acceptanceCheckSchema).optional(),
});
export type Intent = z.infer<typeof intentSchema>;

/** Fields already frozen on AgentJob / Intent, plus optional chat history. */
export const intentAgentInputSchema = z.object({
  prompt: z.string(),
  sessionId: z.string().optional(),
  files: fileMapSchema.optional(),
  toolId: z.string().optional(),
  conversation: z.array(conversationTurnSchema).optional(),
  frontendStack: frontendStackSchema.optional(),
  backendNeed: backendNeedSchema.optional(),
  backendStack: backendStackSchema.optional(),
});
export type IntentAgentInput = z.infer<typeof intentAgentInputSchema>;

export const clarifyChoiceSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  value: z.string(),
  variant: z.enum(["default", "upload", "custom"]).optional(),
  recommended: z.boolean().optional(),
});
export type ClarifyChoice = z.infer<typeof clarifyChoiceSchema>;

/** One clarify step: prompt plus quick-pick cards (custom/upload variants in UI). */
export const clarifyQuestionSchema = z.object({
  text: z.string(),
  helperText: z.string().optional(),
  allowMultiple: z.boolean().optional(),
  inputPlaceholder: z.string().optional(),
  acceptsFiles: z.boolean().optional(),
  /** @deprecated use choices */
  options: z.array(z.string()).min(3).max(6).optional(),
  choices: z.array(clarifyChoiceSchema).min(3).max(6).optional(),
  dataSource: z.boolean().optional(),
  isStackSelector: z.boolean().optional(),
});
export type ClarifyQuestion = z.infer<typeof clarifyQuestionSchema>;

/** Chat extras live here only. Code Generator / Editor parse `intentSchema`. */
export const intentAgentOutputSchema = intentSchema.extend({
  phase: intentPhaseSchema.optional(),
  reply: z.string().optional(),
  questions: z.array(z.string()).optional(),
  questionItems: z.array(clarifyQuestionSchema).optional(),
  acceptanceChecks: z.array(acceptanceCheckSchema).optional(),
});
export type IntentAgentOutput = z.infer<typeof intentAgentOutputSchema>;

export const errorContextSchema = z.object({
  logs: z.string(),
  health: runtimeStatusSchema,
  healAttempt: z.number().int().min(0).max(3).optional(),
});
export type ErrorContext = z.infer<typeof errorContextSchema>;

export const agentJobSchema = z.object({
  sessionId: z.string(),
  intent: intentSchema,
  prompt: z.string(),
  files: fileMapSchema.optional(),
  errorContext: errorContextSchema.optional(),
  frontendStack: frontendStackSchema.optional(),
  backendNeed: backendNeedSchema.optional(),
  backendStack: backendStackSchema.optional(),
});
export type AgentJob = z.infer<typeof agentJobSchema>;

export const agentResultSchema = z.object({
  files: fileMapSchema,
  commitMessage: z.string(),
});
export type AgentResult = z.infer<typeof agentResultSchema>;

export const sessionEventSchema = z.object({
  name: sessionEventNameSchema,
  sessionId: z.string(),
  at: z.string(),
  payload: z.record(z.unknown()).optional(),
});
export type SessionEvent = z.infer<typeof sessionEventSchema>;

/**
 * HTTP (P1-S4):
 * - POST /sessions { prompt } → { sessionId } and enqueue an ARQ job
 * - GET /sessions/:sessionId/events  text/event-stream; each `data:` line is SessionEvent JSON
 *
 * preview.ready payload is PreviewReadyPayload.
 * sandbox.ready payload is SandboxReadyPayload.
 * GET /sessions/:sessionId/files returns SessionFilesResponse.
 */
export const createSessionRequestSchema = z.object({
  prompt: z.string(),
  sessionId: z.string().optional(),
  frontendStack: frontendStackSchema.optional(),
  backendNeed: backendNeedSchema.optional(),
  backendStack: backendStackSchema.optional(),
});
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;

export const createSessionResponseSchema = z.object({
  sessionId: z.string(),
});
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

export const sessionFilesResponseSchema = z.object({
  files: fileMapSchema,
});
export type SessionFilesResponse = z.infer<typeof sessionFilesResponseSchema>;

export const sandboxReadyPayloadSchema = z.object({
  previewUrl: z.string(),
  containerId: z.string(),
});
export type SandboxReadyPayload = z.infer<typeof sandboxReadyPayloadSchema>;

export const previewReadyPayloadSchema = z.object({
  previewUrl: z.string(),
});
export type PreviewReadyPayload = z.infer<typeof previewReadyPayloadSchema>;

export const previewStreamFilePayloadSchema = z.object({
  path: z.string(),
  content: z.string(),
  files: fileMapSchema.optional(),
  complete: z.boolean().optional(),
});
export type PreviewStreamFilePayload = z.infer<typeof previewStreamFilePayloadSchema>;

export const runtimeErrorRequestSchema = z.object({
  message: z.string(),
  source: z.enum(["frontend", "backend"]).default("frontend"),
  stack: z.string().optional(),
  filename: z.string().optional(),
  lineno: z.number().optional(),
  colno: z.number().optional(),
  recentChange: z.string().optional(),
});
export type RuntimeErrorRequest = z.infer<typeof runtimeErrorRequestSchema>;

export const sandboxHandleSchema = z.object({
  sessionId: z.string(),
  previewUrl: z.string(),
  containerId: z.string(),
});
export type SandboxHandle = z.infer<typeof sandboxHandleSchema>;

export const healthReportSchema = z.object({
  status: runtimeStatusSchema,
  logs: z.string(),
});
export type HealthReport = z.infer<typeof healthReportSchema>;

export const toolSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  ownerEmail: z.string().email().nullish(),
  name: z.string(),
  summary: z.string(),
  status: runtimeStatusSchema,
  visibility: toolVisibilitySchema.default("private"),
  groupId: z.string().nullish(),
  groupName: z.string().nullish(),
  myRole: toolRoleSchema.nullish(),
  autoApproveTests: z.boolean().optional(),
  draftVersionId: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
  latestVersionId: z.string().nullish(),
  latestSessionId: z.string().nullish(),
});
export type Tool = z.infer<typeof toolSchema>;

export const toolMemberSchema = z.object({
  toolId: z.string(),
  userId: z.string(),
  role: toolRoleSchema,
});
export type ToolMember = z.infer<typeof toolMemberSchema>;

export const toolMembersResponseSchema = z.object({
  members: z.array(toolMemberSchema),
});
export type ToolMembersResponse = z.infer<typeof toolMembersResponseSchema>;

export const shareToolRequestSchema = z.object({
  emailOrUserId: z.string().min(1),
  role: z.enum(["editor", "viewer"]),
});
export type ShareToolRequest = z.infer<typeof shareToolRequestSchema>;

export const toolVersionSchema = z.object({
  id: z.string(),
  toolId: z.string(),
  versionNumber: z.number(),
  prompt: z.string(),
  summary: z.string(),
  fileCount: z.number(),
  createdAt: z.string(),
});
export type ToolVersion = z.infer<typeof toolVersionSchema>;

export const toolSummarySchema = toolSchema.extend({
  fileCount: z.number(),
});
export type ToolSummary = z.infer<typeof toolSummarySchema>;

export const publishToolRequestSchema = z
  .object({
    name: z.string().nullish(),
    summary: z.string().nullish(),
    visibility: z.enum(["all", "group"]).default("all"),
    groupId: z.string().nullish(),
    groupName: z.string().nullish(),
    acknowledgeWarnings: z.boolean().optional(),
    versionId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.visibility === "group" && !value.groupId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "groupId is required when visibility is group",
        path: ["groupId"],
      });
    }
  });
export type PublishToolRequest = z.infer<typeof publishToolRequestSchema>;

export const publishToolResponseSchema = z.object({
  tool: toolSummarySchema,
  version: toolVersionSchema,
});
export type PublishToolResponse = z.infer<typeof publishToolResponseSchema>;

export const workspaceToolsResponseSchema = z.object({
  tools: z.array(toolSummarySchema),
});
export type WorkspaceToolsResponse = z.infer<typeof workspaceToolsResponseSchema>;

export const openToolResponseSchema = z.object({
  sessionId: z.string(),
  previewUrl: z.string(),
  tool: toolSummarySchema,
  role: toolRoleSchema,
});
export type OpenToolResponse = z.infer<typeof openToolResponseSchema>;

export const toolIndexRecordSchema = z.object({
  toolId: z.string(),
  stack: stackSchema,
  summary: z.string(),
  promptFingerprint: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ToolIndexRecord = z.infer<typeof toolIndexRecordSchema>;

export const smartMatchResultSchema = z.object({
  hit: z.boolean(),
  toolId: z.string().nullish(),
  score: z.number().min(0).max(1).nullish(),
  matchedTool: toolSchema.nullish(),
});
export type SmartMatchResult = z.infer<typeof smartMatchResultSchema>;

export const acceptMatchRequestSchema = z.object({
  sessionId: z.string(),
  toolId: z.string(),
});
export type AcceptMatchRequest = z.infer<typeof acceptMatchRequestSchema>;

export const gitHubStatusResponseSchema = z.object({
  configured: z.boolean(),
  connected: z.boolean(),
  login: z.string().nullish(),
  repo: z.string().nullish(),
  htmlUrl: z.string().nullish(),
});
export type GitHubStatusResponse = z.infer<typeof gitHubStatusResponseSchema>;

export const gitHubPushRequestSchema = z.object({
  sessionId: z.string(),
  repoName: z.string().nullish(),
  message: z.string().nullish(),
  description: z.string().nullish(),
  private: z.boolean().nullish(),
});
export type GitHubPushRequest = z.infer<typeof gitHubPushRequestSchema>;

export const gitHubPushResponseSchema = z.object({
  htmlUrl: z.string(),
  repo: z.string(),
  created: z.boolean(),
});
export type GitHubPushResponse = z.infer<typeof gitHubPushResponseSchema>;

// ── P7 Trust, remediation, change requests ───────────────────────────────────

export const vulnSourceSchema = z.enum(["osv", "semgrep", "gitleaks", "trivy", "attack"]);
export type VulnSource = z.infer<typeof vulnSourceSchema>;

export const severitySchema = z.enum(["low", "medium", "high", "critical"]);
export type Severity = z.infer<typeof severitySchema>;

export const vulnerabilityFindingSchema = z.object({
  id: z.string(),
  toolId: z.string(),
  versionId: z.string(),
  source: vulnSourceSchema,
  severity: severitySchema,
  title: z.string(),
  advisoryId: z.string().optional(),
  packageName: z.string().optional(),
  installedVersion: z.string().optional(),
  fixedVersions: z.array(z.string()).optional(),
  file: z.string().optional(),
  rule: z.string().optional(),
  reachable: z.boolean().nullable().optional(),
  detectedAt: z.string(),
});
export type VulnerabilityFinding = z.infer<typeof vulnerabilityFindingSchema>;

export const healthStatusSchema = z.enum([
  "checking",
  "healthy",
  "warning",
  "unsafe",
  "stale",
]);
export type HealthStatus = z.infer<typeof healthStatusSchema>;

export const checkStepSchema = z.enum([
  "tests",
  "regression",
  "dependencies",
  "code",
  "secrets",
  "image",
  "attacks",
]);
export type CheckStep = z.infer<typeof checkStepSchema>;

export const toolHealthSchema = z.object({
  toolId: z.string(),
  versionId: z.string(),
  fileMapHash: z.string(),
  vulnDbVersion: z.string(),
  status: healthStatusSchema,
  checkedAt: z.string(),
  tests: z.object({
    passed: z.number(),
    total: z.number(),
    failedIds: z.array(z.string()),
  }),
  attacks: z.object({
    attempted: z.number(),
    succeeded: z.number(),
    notApplicable: z.array(z.string()),
  }),
  vulnerabilities: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  secretsFound: z.number(),
  codeIssues: z.number(),
  activeSuppressions: z.number(),
  blockingReasons: z.array(z.string()),
  warnings: z.array(z.string()),
});
export type ToolHealth = z.infer<typeof toolHealthSchema>;

export const remediationStrategySchema = z.enum([
  "patch_upgrade",
  "code_fix",
  "major_upgrade",
  "replace_package",
  "remove_dependency",
  "suppress",
  "contain",
]);
export type RemediationStrategy = z.infer<typeof remediationStrategySchema>;

export const remediationAttemptSchema = z.object({
  findingId: z.string(),
  strategy: remediationStrategySchema,
  attempt: z.number(),
  draftVersionId: z.string().optional(),
  checksPassed: z.number().optional(),
  checksTotal: z.number().optional(),
  rescanClean: z.boolean().optional(),
  outcome: z.enum(["fixed", "failed", "needs_approval"]),
});
export type RemediationAttempt = z.infer<typeof remediationAttemptSchema>;

export const suppressionSchema = z.object({
  findingId: z.string(),
  reason: z.string(),
  evidence: z.string().optional(),
  approvedBy: z.string(),
  expiresAt: z.string(),
});
export type Suppression = z.infer<typeof suppressionSchema>;

export const remediationCampaignSchema = z.object({
  id: z.string(),
  advisoryId: z.string(),
  toolIds: z.array(z.string()),
  canaryToolId: z.string(),
  fixed: z.number(),
  failed: z.number(),
  pendingApproval: z.number(),
});
export type RemediationCampaign = z.infer<typeof remediationCampaignSchema>;

export const ledgerEntryKindSchema = z.enum([
  "detected",
  "attempt",
  "fixed",
  "suppressed",
  "reopened",
  "escalated",
  "contained",
]);
export type LedgerEntryKind = z.infer<typeof ledgerEntryKindSchema>;

export const ledgerEntrySchema = z.object({
  id: z.string(),
  toolId: z.string(),
  at: z.string(),
  kind: ledgerEntryKindSchema,
  findingId: z.string().optional(),
  detail: z.string(),
});
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;

export const changeChannelSchema = z.enum(["whatsapp", "slack", "teams", "email", "web"]);
export type ChangeChannel = z.infer<typeof changeChannelSchema>;

export const changeRequestStatusSchema = z.enum([
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
]);
export type ChangeRequestStatus = z.infer<typeof changeRequestStatusSchema>;

export const changeRequestSchema = z.object({
  id: z.string(),
  channel: changeChannelSchema,
  externalMessageId: z.string(),
  actorId: z.string(),
  toolId: z.string().optional(),
  text: z.string(),
  status: changeRequestStatusSchema,
  sessionId: z.string().optional(),
  draftVersionId: z.string().optional(),
  proposedChecks: z.array(acceptanceCheckSchema).optional(),
  leaseOwner: z.string().optional(),
  leaseExpiresAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ChangeRequest = z.infer<typeof changeRequestSchema>;

export const channelLinkSchema = z.object({
  actorId: z.string(),
  channel: changeChannelSchema,
  address: z.string(),
  verifiedAt: z.string(),
});
export type ChannelLink = z.infer<typeof channelLinkSchema>;

export const checkStepPayloadSchema = z.object({
  step: checkStepSchema,
  status: z.enum(["running", "passed", "failed", "skipped"]),
  detail: z.string().optional(),
});
export type CheckStepPayload = z.infer<typeof checkStepPayloadSchema>;

export const checkCompletedPayloadSchema = z.object({
  health: toolHealthSchema,
});
export type CheckCompletedPayload = z.infer<typeof checkCompletedPayloadSchema>;

export const publishBlockedPayloadSchema = z.object({
  blockingReasons: z.array(z.string()),
});
export type PublishBlockedPayload = z.infer<typeof publishBlockedPayloadSchema>;

export const toolHealthResponseSchema = z.object({
  live: toolHealthSchema.nullish(),
  draft: toolHealthSchema.nullish(),
});
export type ToolHealthResponse = z.infer<typeof toolHealthResponseSchema>;

export const ledgerResponseSchema = z.object({
  entries: z.array(ledgerEntrySchema),
});
export type LedgerResponse = z.infer<typeof ledgerResponseSchema>;

export const publishBlockedResponseSchema = z.object({
  blockingReasons: z.array(z.string()),
  health: toolHealthSchema,
});
export type PublishBlockedResponse = z.infer<typeof publishBlockedResponseSchema>;

export const whatsAppLinkCodeResponseSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
});
export type WhatsAppLinkCodeResponse = z.infer<typeof whatsAppLinkCodeResponseSchema>;
