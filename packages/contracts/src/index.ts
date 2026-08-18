import { z } from "zod";

/** Until P6-S1, every actor is this stub. */
export const DEV_USER = "dev-user" as const;

export const stackSchema = z.enum(["react", "fullstack"]);
export type Stack = z.infer<typeof stackSchema>;

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
  "preview.ready",
]);
export type SessionEventName = z.infer<typeof sessionEventNameSchema>;

/** path → file contents */
export const fileMapSchema = z.record(z.string());
export type FileMap = z.infer<typeof fileMapSchema>;

export const intentSchema = z.object({
  kind: intentKindSchema,
  stack: stackSchema,
  summary: z.string(),
  toolId: z.string().optional(),
});
export type Intent = z.infer<typeof intentSchema>;

export const agentJobSchema = z.object({
  sessionId: z.string(),
  intent: intentSchema,
  prompt: z.string(),
  files: fileMapSchema.optional(),
  errorContext: z
    .object({
      logs: z.string(),
      health: runtimeStatusSchema,
    })
    .optional(),
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
 */
export const createSessionRequestSchema = z.object({
  prompt: z.string(),
});
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;

export const createSessionResponseSchema = z.object({
  sessionId: z.string(),
});
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

export const sandboxReadyPayloadSchema = z.object({
  previewUrl: z.string(),
  containerId: z.string(),
});
export type SandboxReadyPayload = z.infer<typeof sandboxReadyPayloadSchema>;

export const previewReadyPayloadSchema = z.object({
  previewUrl: z.string(),
});
export type PreviewReadyPayload = z.infer<typeof previewReadyPayloadSchema>;

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
