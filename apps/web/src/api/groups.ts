/**
 * Group management and edit-access requests.
 * Stored in Postgres via the Terrarium API.
 */
import { getAuthHeaders } from "./auth";

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  memberCount?: number;
}

export interface Member {
  user_id: string;
  email: string;
  role: "admin" | "member";
}

export interface AccessRequest {
  id: string;
  tool_id: string;
  tool_name: string;
  requester_id: string;
  requester_email: string;
  owner_id: string;
  status: "pending" | "approved" | "denied";
}

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function fail(response: Response, json: unknown, fallback: string): never {
  const detail = (json as { detail?: unknown } | null)?.detail;
  throw new Error(typeof detail === "string" ? detail : `${fallback} (${response.status}).`);
}

export async function createGroup(name: string, _userId?: string, _email?: string): Promise<Group> {
  const response = await fetch("/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ name }),
  });
  const json = await readJson(response);
  if (!response.ok || !json || typeof json !== "object") {
    fail(response, json, "Could not create group");
  }
  const data = json as { id: string; name: string; createdBy: string; memberCount?: number };
  return { id: data.id, name: data.name, createdBy: data.createdBy, memberCount: data.memberCount };
}

export async function listGroups(_userEmail?: string): Promise<Group[]> {
  const response = await fetch("/groups", { headers: getAuthHeaders() });
  const json = await readJson(response);
  if (!response.ok || !Array.isArray(json)) {
    fail(response, json, "Could not load groups");
  }
  return json as Group[];
}

export async function listMembers(groupId: string): Promise<Member[]> {
  const response = await fetch(`/groups/${encodeURIComponent(groupId)}/members`, {
    headers: getAuthHeaders(),
  });
  const json = await readJson(response);
  if (!response.ok || !Array.isArray(json)) {
    fail(response, json, "Could not load members");
  }
  return json as Member[];
}

export async function addMember(
  groupId: string,
  email: string,
  role: "admin" | "member" = "member"
): Promise<Member> {
  const response = await fetch(`/groups/${encodeURIComponent(groupId)}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ email, role }),
  });
  const json = await readJson(response);
  if (!response.ok || !json || typeof json !== "object") {
    fail(response, json, "Could not add member");
  }
  return json as Member;
}

export async function removeMember(groupId: string, email: string): Promise<void> {
  const response = await fetch(
    `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(email)}`,
    { method: "DELETE", headers: getAuthHeaders() }
  );
  if (!response.ok && response.status !== 204) {
    fail(response, await readJson(response), "Could not remove member");
  }
}

export async function getMyAccessRequests(_requesterId?: string): Promise<AccessRequest[]> {
  const response = await fetch("/access-requests/mine", { headers: getAuthHeaders() });
  const json = await readJson(response);
  if (!response.ok || !Array.isArray(json)) {
    fail(response, json, "Could not load access requests");
  }
  return json as AccessRequest[];
}

export async function requestAppAccess(
  toolId: string,
  toolName: string,
  ownerId: string,
  _requesterId?: string,
  _requesterEmail?: string
): Promise<AccessRequest> {
  const response = await fetch("/access-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ tool_id: toolId, tool_name: toolName, owner_id: ownerId }),
  });
  const json = await readJson(response);
  if (!response.ok || !json || typeof json !== "object") {
    fail(response, json, "Could not send edit request");
  }
  return json as AccessRequest;
}

export async function getPendingRequests(_ownerId?: string): Promise<AccessRequest[]> {
  const response = await fetch("/access-requests/pending", { headers: getAuthHeaders() });
  const json = await readJson(response);
  if (!response.ok || !Array.isArray(json)) {
    fail(response, json, "Could not load pending requests");
  }
  return json as AccessRequest[];
}

export async function approveRequest(requestId: string): Promise<void> {
  const response = await fetch(`/access-requests/${encodeURIComponent(requestId)}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    fail(response, await readJson(response), "Could not approve request");
  }
}

export async function denyRequest(requestId: string): Promise<void> {
  const response = await fetch(`/access-requests/${encodeURIComponent(requestId)}/deny`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    fail(response, await readJson(response), "Could not deny request");
  }
}
