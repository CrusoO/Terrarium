import {
  gitHubPushResponseSchema,
  gitHubStatusResponseSchema,
  type GitHubPushResponse,
  type GitHubStatusResponse,
} from "@terrarium/contracts";
import { getAuthHeaders } from "./auth";

export async function fetchGitHubStatus(sessionId: string): Promise<GitHubStatusResponse> {
  const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  const response = await fetch(`/github/status${params}`, { headers: getAuthHeaders() });
  const json: unknown = await response.json().catch(() => null);
  const parsed = gitHubStatusResponseSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    throw new Error(`GET /github/status failed (${response.status}).`);
  }
  return parsed.data;
}

export async function pushSessionToGitHub(
  sessionId: string,
  options?: { repoName?: string; description?: string; private?: boolean }
): Promise<GitHubPushResponse> {
  const response = await fetch("/github/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({
      sessionId,
      repoName: options?.repoName,
      description: options?.description,
      private: options?.private,
    }),
  });
  const json: unknown = await response.json().catch(() => null);
  const parsed = gitHubPushResponseSchema.safeParse(json);
  if (!response.ok || !parsed.success) {
    const detail =
      json && typeof json === "object" && "detail" in json
        ? String((json as { detail: unknown }).detail)
        : `POST /github/push failed (${response.status}).`;
    throw new Error(detail);
  }
  return parsed.data;
}

export async function connectGitHubToken(
  token: string,
  sessionId: string,
  options?: { setDefault?: boolean; replaceRepo?: boolean }
): Promise<{ login: string }> {
  const response = await fetch("/github/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({
      token,
      sessionId,
      setDefault: options?.setDefault ?? true,
      replaceRepo: options?.replaceRepo ?? false,
    }),
  });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok || !json || typeof json !== "object") {
    const detail =
      json && typeof json === "object" && "detail" in json
        ? String((json as { detail: unknown }).detail)
        : `GitHub connect failed (${response.status}).`;
    throw new Error(detail);
  }
  return { login: String((json as { login?: string }).login || "") };
}

export function githubLoginHref(sessionId: string): string {
  return `/github/login?sessionId=${encodeURIComponent(sessionId)}`;
}

export async function startGitHubDevice(): Promise<{
  userCode: string;
  verificationUri: string;
  interval: number;
}> {
  const response = await fetch("/github/device/start", {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok || !json || typeof json !== "object") {
    const detail =
      json && typeof json === "object" && "detail" in json
        ? String((json as { detail: unknown }).detail)
        : `GitHub device login failed (${response.status}).`;
    throw new Error(detail);
  }
  const data = json as { userCode?: string; verificationUri?: string; interval?: number };
  return {
    userCode: String(data.userCode || ""),
    verificationUri: String(data.verificationUri || "https://github.com/login/device"),
    interval: Number(data.interval || 5),
  };
}

export async function pollGitHubDevice(sessionId: string): Promise<{ connected: boolean; pending: boolean }> {
  const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  const response = await fetch(`/github/device/poll${params}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok || !json || typeof json !== "object") {
    const detail =
      json && typeof json === "object" && "detail" in json
        ? String((json as { detail: unknown }).detail)
        : `GitHub login poll failed (${response.status}).`;
    throw new Error(detail);
  }
  const data = json as { connected?: boolean; pending?: boolean };
  return { connected: Boolean(data.connected), pending: Boolean(data.pending) };
}
