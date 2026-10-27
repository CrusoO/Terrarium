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

export type TrustCheckStatus = "passed" | "failed" | "skipped";
export type TrustSeverity = "critical" | "high" | "medium" | "low" | "info";

export type TrustCheck = {
  id: string;
  kind: "functional" | "security";
  name: string;
  status: TrustCheckStatus;
  severity: TrustSeverity;
  detail: string;
  source: "static" | "scanner" | "node:test";
  rootProblem: string | null;
  evidence: { file: string; line: number | null; snippet: string }[];
  related: string[];
  fix: "codemod" | "editor" | null;
  fixSummary: string;
};

export type TrustCounts = { passed: number; failed: number; skipped: number; total: number };

export type TrustReport = {
  toolId: string;
  versionId: string;
  versionNumber: number;
  checkedAt: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  status: "healthy" | "attention" | "unsafe";
  headline: string;
  tests: TrustCounts;
  security: TrustCounts;
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
  fixable: number;
  testRunner: { status: string; detail: string; durationMs: number; files: string[] };
  rootProblems: { id: string; title: string; detail: string; status: "failing" | "covered" }[];
  checks: TrustCheck[];
  canFix?: boolean;
  demo?: boolean;
};

export type TrustFixResult = {
  before: TrustReport;
  after: TrustReport;
  kept?: boolean;
  changes: { checkId: string; name: string; how: "codemod" | "editor"; summary: string; files: string[] }[];
  diffs: { path: string; status: "added" | "modified" | "deleted"; diff: string }[];
  unresolved: { id: string; name: string; kind: string; detail: string }[];
  editor?: { used: boolean; model?: string; error?: string; commitMessage?: string } | null;
  version: { id: string; versionNumber: number } | null;
};

export function fetchTrustReport(toolId: string): Promise<TrustReport> {
  return api(`/tools/${toolId}/trust-report`);
}

export function fixTrustReport(toolId: string): Promise<TrustFixResult> {
  return api(`/tools/${toolId}/trust-report/fix`, { method: "POST" });
}

export function restoreTrustReport(toolId: string): Promise<TrustReport> {
  return api(`/tools/${toolId}/trust-report/restore`, { method: "POST" });
}

export function publishTool(
  toolId: string,
  body: { acknowledgeWarnings?: boolean; versionId?: string },
): Promise<unknown> {
  return api(`/tools/${toolId}/publish`, { method: "POST", body: JSON.stringify(body) });
}
