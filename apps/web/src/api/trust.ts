import {
  toolHealthSchema,
  type LedgerResponse,
  type ToolHealth,
  type ToolHealthResponse,
} from "@terrarium/contracts";
import { getAuthHeaders } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:3010";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || response.statusText);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function fetchToolHealth(toolId: string): Promise<ToolHealthResponse> {
  return api(`/tools/${toolId}/health`);
}

export function runPublishCheck(toolId: string, versionId: string): Promise<ToolHealth> {
  return api(`/tools/${toolId}/versions/${versionId}/publish-check`, { method: "POST" });
}

export function remediateTool(toolId: string): Promise<ToolHealth> {
  return api(`/tools/${toolId}/remediate`, { method: "POST" });
}

export function fetchLedger(toolId: string): Promise<LedgerResponse> {
  return api(`/tools/${toolId}/ledger`);
}

export async function runSessionPublishCheck(sessionId: string): Promise<ToolHealth> {
  const response = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/publish-check`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  const json: unknown = await response.json().catch(() => null);
  const parsed = toolHealthSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    throw new Error(`Publish check failed (${response.status}).`);
  }
  return parsed.data;
}

export function publishTool(
  toolId: string,
  body: { acknowledgeWarnings?: boolean; versionId?: string },
): Promise<unknown> {
  return api(`/tools/${toolId}/publish`, { method: "POST", body: JSON.stringify(body) });
}
