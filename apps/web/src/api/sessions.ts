import {
  createSessionRequestSchema,
  createSessionResponseSchema,
  type CreateSessionRequest,
  type CreateSessionResponse,
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
    throw new Error(
      `POST /sessions failed (${response.status}). Live run starts when the session API lands in P1-S4.`
    );
  }
  return created.data;
}
