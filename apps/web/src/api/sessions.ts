import {
  createSessionRequestSchema,
  createSessionResponseSchema,
  sessionEventSchema,
  type CreateSessionRequest,
  type CreateSessionResponse,
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

export function subscribeSessionEvents(
  sessionId: string,
  onEvent: (event: SessionEvent) => void
): EventSource {
  const source = new EventSource(`/sessions/${encodeURIComponent(sessionId)}/events`);
  source.onmessage = (message: MessageEvent<string>) => {
    try {
      const parsed = sessionEventSchema.safeParse(JSON.parse(message.data));
      if (parsed.success) {
        onEvent(parsed.data);
      }
    } catch {
      // Ignore malformed SSE payloads rather than breaking the stream.
    }
  };
  return source;
}
