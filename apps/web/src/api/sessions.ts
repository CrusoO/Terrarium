import {
  createSessionRequestSchema,
  createSessionResponseSchema,
  sessionEventSchema,
  sessionFilesResponseSchema,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type FileMap,
  type SessionEvent,
} from "@terrarium/contracts";

export async function createSession(
  request: CreateSessionRequest
): Promise<CreateSessionResponse> {
  const body = createSessionRequestSchema.parse(request);
  const response = await fetch("/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: unknown = await response.json().catch(() => null);
  const created = createSessionResponseSchema.safeParse(json);
  if (!response.ok || !created.success) {
    throw new Error(`POST /sessions failed (${response.status}).`);
  }
  return created.data;
}

export async function fetchSessionFiles(sessionId: string): Promise<FileMap> {
  const response = await fetch(`/sessions/${encodeURIComponent(sessionId)}/files`);
  const json: unknown = await response.json().catch(() => null);
  const parsed = sessionFilesResponseSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    throw new Error(`GET /sessions/${sessionId}/files failed (${response.status}).`);
  }
  return parsed.data.files;
}

export function subscribeSessionEvents(
  sessionId: string,
  onEvent: (event: SessionEvent, eventId?: string) => void,
  lastEventId = "0-0"
): EventSource {
  const params = lastEventId && lastEventId !== "0-0" ? `?lastEventId=${encodeURIComponent(lastEventId)}` : "";
  const source = new EventSource(`/sessions/${encodeURIComponent(sessionId)}/events${params}`);
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
