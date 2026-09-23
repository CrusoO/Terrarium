import { z } from "zod";

/** Until P6-S1, every actor is this stub. */
export const DEV_USER = "dev-user" as const;

export const stackSchema = z.enum(["react", "fullstack"]);
export type Stack = z.infer<typeof stackSchema>;

export const frontendStackSchema = z.enum(["vanilla", "react"]);
export type FrontendStack = z.infer<typeof frontendStackSchema>;

export const backendNeedSchema = z.enum(["auto", "yes", "no"]);
export type BackendNeed = z.infer<typeof backendNeedSchema>;

export const backendStackSchema = z.enum(["none", "node-express"]);
export type BackendStack = z.infer<typeof backendStackSchema>;

export const intentKindSchema = z.enum(["new", "modify"]);
export type IntentKind = z.infer<typeof intentKindSchema>;

export const toolRoleSchema = z.enum(["owner", "editor", "viewer"]);
export type ToolRole = z.infer<typeof toolRoleSchema>;

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

export const intentSchema = z.object({
  kind: intentKindSchema,
  stack: stackSchema,
  summary: z.string(),
  toolId: z.string().optional(),
  frontendStack: frontendStackSchema.optional(),
  backendStack: backendStackSchema.optional(),
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

/** Chat extras live here only. Code Generator / Editor parse `intentSchema`. */
export const intentAgentOutputSchema = intentSchema.extend({
  phase: intentPhaseSchema.optional(),
  reply: z.string().optional(),
  questions: z.array(z.string()).optional(),
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
  name: z.string(),
  summary: z.string(),
  status: runtimeStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  latestVersionId: z.string().nullish(),
  latestSessionId: z.string().nullish(),
});
export type Tool = z.infer<typeof toolSchema>;

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

export const publishToolRequestSchema = z.object({
  name: z.string().nullish(),
  summary: z.string().nullish(),
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
