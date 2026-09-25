import {
  acceptMatchRequestSchema,
  createSessionRequestSchema,
  createSessionResponseSchema,
  openToolResponseSchema,
  publishToolRequestSchema,
  publishToolResponseSchema,
  runtimeErrorRequestSchema,
  sessionEventSchema,
  sessionFilesResponseSchema,
  shareToolRequestSchema,
  toolMembersResponseSchema,
  toolSummarySchema,
  workspaceToolsResponseSchema,
  type AcceptMatchRequest,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type FileMap,
  type OpenToolResponse,
  type PublishToolRequest,
  type PublishToolResponse,
  type RuntimeErrorRequest,
  type SessionEvent,
  type ShareToolRequest,
  type ToolMember,
  type ToolSummary,
} from "@terrarium/contracts";
import { getAuthHeaders } from "./auth";

export async function createSession(
  request: CreateSessionRequest
): Promise<CreateSessionResponse> {
  const body = createSessionRequestSchema.parse(request);
  const controller = new AbortController();
  const abortTimer = window.setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch("/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Could not reach the API. Check that it is running on port 3001.");
    }
    throw error;
  } finally {
    window.clearTimeout(abortTimer);
  }
  const json: unknown = await response.json().catch(() => null);
  const created = createSessionResponseSchema.safeParse(json);
  if (!response.ok || !created.success) {
    throw new Error(`POST /sessions failed (${response.status}).`);
  }
  return created.data;
}

export async function fetchSessionFiles(sessionId: string): Promise<FileMap> {
  const response = await fetch(`/sessions/${encodeURIComponent(sessionId)}/files`, { headers: getAuthHeaders() });
  const json: unknown = await response.json().catch(() => null);
  const parsed = sessionFilesResponseSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    throw new Error(`GET /sessions/${sessionId}/files failed (${response.status}).`);
  }
  return parsed.data.files;
}

export async function reportRuntimeError(
  sessionId: string,
  request: RuntimeErrorRequest
): Promise<boolean> {
  const body = runtimeErrorRequestSchema.parse(request);
  const response = await fetch(`/sessions/${encodeURIComponent(sessionId)}/runtime-errors`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  const json: unknown = await response.json().catch(() => null);
  return response.ok && Boolean((json as { accepted?: unknown } | null)?.accepted);
}

export function subscribeSessionEvents(
  sessionId: string,
  onEvent: (event: SessionEvent, eventId?: string) => void,
  lastEventId = "0-0"
): EventSource {
  const params = lastEventId && lastEventId !== "0-0" ? `?lastEventId=${encodeURIComponent(lastEventId)}` : "";
  const source = new EventSource(`/sessions/${encodeURIComponent(sessionId)}/events${params}`, {
    withCredentials: true,
  });
  source.onmessage = (message: MessageEvent<string>) => {
    try {
      const parsed = sessionEventSchema.safeParse(JSON.parse(message.data));
      if (parsed.success) {
        onEvent(parsed.data, message.lastEventId || undefined);
      }
    } catch {
      // Ignore malformed SSE payloads rather than breaking the stream.
    }
  };
  return source;
}

export async function fetchWorkspaceTools(): Promise<ToolSummary[]> {
  const response = await fetch("/workspace/tools", { headers: getAuthHeaders() });
  const json: unknown = await response.json().catch(() => null);
  const parsed = workspaceToolsResponseSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    throw new Error(`GET /workspace/tools failed (${response.status}).`);
  }
  return parsed.data.tools;
}

export async function publishSession(
  sessionId: string,
  request: PublishToolRequest
): Promise<PublishToolResponse> {
  const body = publishToolRequestSchema.parse(request);
  const response = await fetch(`/sessions/${encodeURIComponent(sessionId)}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  const json: unknown = await response.json().catch(() => null);
  const parsed = publishToolResponseSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    throw new Error(`POST /sessions/${sessionId}/publish failed (${response.status}).`);
  }
  return parsed.data;
}

export async function openWorkspaceTool(toolId: string): Promise<OpenToolResponse> {
  const response = await fetch(`/workspace/tools/${encodeURIComponent(toolId)}/open`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const json: unknown = await response.json().catch(() => null);
  const parsed = openToolResponseSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    const detail = (json as { detail?: unknown } | null)?.detail;
    throw new Error(
      typeof detail === "string" ? detail : `POST /workspace/tools/${toolId}/open failed (${response.status}).`
    );
  }
  return parsed.data;
}

export async function sleepWorkspaceTool(toolId: string): Promise<ToolSummary> {
  const response = await fetch(`/workspace/tools/${encodeURIComponent(toolId)}/sleep`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const json: unknown = await response.json().catch(() => null);
  const parsed = toolSummarySchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    throw new Error(`POST /workspace/tools/${toolId}/sleep failed (${response.status}).`);
  }
  return parsed.data;
}

export async function shareTool(toolId: string, request: ShareToolRequest): Promise<ToolMember> {
  const body = shareToolRequestSchema.parse(request);
  const response = await fetch(`/workspace/tools/${encodeURIComponent(toolId)}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = (json as { detail?: unknown } | null)?.detail;
    throw new Error(typeof detail === "string" ? detail : `Share failed (${response.status}).`);
  }
  return json as ToolMember;
}

export async function fetchToolMembers(toolId: string): Promise<ToolMember[]> {
  const response = await fetch(`/workspace/tools/${encodeURIComponent(toolId)}/members`, {
    headers: getAuthHeaders(),
  });
  const json: unknown = await response.json().catch(() => null);
  const parsed = toolMembersResponseSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    throw new Error(`GET /workspace/tools/${toolId}/members failed (${response.status}).`);
  }
  return parsed.data.members;
}

export async function acceptSmartMatch(
  sessionId: string,
  toolId: string
): Promise<OpenToolResponse> {
  const body: AcceptMatchRequest = { sessionId, toolId };
  const bodyParsed = acceptMatchRequestSchema.parse(body);
  const response = await fetch(`/sessions/${encodeURIComponent(sessionId)}/accept-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(bodyParsed),
  });
  const json: unknown = await response.json().catch(() => null);
  const parsed = openToolResponseSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    throw new Error(`POST /sessions/${sessionId}/accept-match failed (${response.status}).`);
  }
  return parsed.data;
}

export async function rejectSmartMatch(_sessionId: string, _prompt: string): Promise<void> {
  // Rejecting a match means just continuing with the original session
  // by sending a new prompt. The backend will proceed to Code Generator.
  // This is a no-op API call since rejection is implicit in continuing.
  // For now, we don't need a separate endpoint.
  return Promise.resolve();
}
