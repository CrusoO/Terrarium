/**
 * Group management and preview access requests.
 * All data stored in Firebase Firestore via REST API (no WebSocket SDK).
 *
 * Collections:
 *   groups/{groupId}                   { name, createdBy, memberIds[] }
 *   groups/{groupId}/members/{userId}  { email, role }
 *   access_requests/{id}               { session_id, requester_id, requester_email, owner_id, status }
 */
import { fsAdd, fsDelete, fsGet, fsList, fsQuery, fsSet, fsUpdate } from "../lib/firestore";

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

function requestDocId(toolId: string, requesterId: string): string {
  return `${toolId}_${requesterId}`;
}

function toAccessRequest(d: Record<string, unknown>): AccessRequest {
  return {
    id: d.id as string,
    tool_id: (d.tool_id as string) ?? "",
    tool_name: (d.tool_name as string) ?? "Untitled app",
    requester_id: d.requester_id as string,
    requester_email: d.requester_email as string,
    owner_id: d.owner_id as string,
    status: d.status as AccessRequest["status"],
  };
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function createGroup(name: string, userId: string, email: string): Promise<Group> {
  const normalized = email.trim().toLowerCase();
  const doc = await fsAdd("groups", { name, createdBy: userId, createdByEmail: normalized, memberEmails: [normalized] });
  const groupId = doc.id as string;
  await fsSet(`groups/${groupId}/members/${encodeEmail(normalized)}`, { email: normalized, role: "admin" });
  return { id: groupId, name, createdBy: userId, memberCount: 1 };
}

export async function listGroups(userEmail: string): Promise<Group[]> {
  const docs = await fsQuery("groups", [
    { field: "memberEmails", op: "ARRAY_CONTAINS", value: userEmail.trim().toLowerCase() },
  ]);
  return docs.map((d) => ({
    id: d.id as string,
    name: d.name as string,
    createdBy: d.createdBy as string,
    memberCount: ((d.memberEmails as unknown[]) ?? []).length,
  }));
}

export async function listMembers(groupId: string): Promise<Member[]> {
  const docs = await fsList(`groups/${groupId}/members`);
  return docs.map((d) => ({
    user_id: d.email as string, // use email as the identifier
    email: d.email as string,
    role: (d.role as "admin" | "member") ?? "member",
  }));
}

export async function addMember(
  groupId: string,
  email: string,
  role: "admin" | "member" = "member"
): Promise<Member> {
  const normalized = email.trim().toLowerCase();
  await fsSet(`groups/${groupId}/members/${encodeEmail(normalized)}`, { email: normalized, role });
  const group = await fsGet(`groups/${groupId}`);
  const existing = (group?.memberEmails as string[]) ?? [];
  if (!existing.includes(normalized)) {
    await fsUpdate(`groups/${groupId}`, { memberEmails: [...existing, normalized] });
  }
  return { user_id: normalized, email: normalized, role };
}

export async function removeMember(groupId: string, email: string): Promise<void> {
  await fsDelete(`groups/${groupId}/members/${encodeEmail(email)}`);
  const group = await fsGet(`groups/${groupId}`);
  const existing = (group?.memberEmails as string[]) ?? [];
  await fsUpdate(`groups/${groupId}`, { memberEmails: existing.filter((e) => e !== email) });
}

function encodeEmail(email: string): string {
  // Firestore doc IDs can't contain '/' — replace with safe chars
  return email.replace(/\./g, "%2E").replace(/@/g, "%40");
}

// ── Access Requests ───────────────────────────────────────────────────────────

export async function getMyAccessRequest(toolId: string, requesterId: string): Promise<AccessRequest | null> {
  const doc = await fsGet(`access_requests/${requestDocId(toolId, requesterId)}`);
  return doc ? toAccessRequest(doc) : null;
}

export async function getMyAccessRequests(requesterId: string): Promise<AccessRequest[]> {
  const docs = await fsQuery("access_requests", [
    { field: "requester_id", op: "EQUAL", value: requesterId },
  ]);
  return docs.map(toAccessRequest);
}

export async function requestAppAccess(
  toolId: string,
  toolName: string,
  ownerId: string,
  requesterId: string,
  requesterEmail: string
): Promise<AccessRequest> {
  const id = requestDocId(toolId, requesterId);
  const existing = await fsGet(`access_requests/${id}`);
  if (existing?.status === "approved" || existing?.status === "pending") {
    return toAccessRequest(existing);
  }
  const payload = {
    tool_id: toolId,
    tool_name: toolName,
    requester_id: requesterId,
    requester_email: requesterEmail.trim().toLowerCase(),
    owner_id: ownerId,
    status: "pending" as const,
  };
  await fsSet(`access_requests/${id}`, payload);
  return { id, ...payload };
}

export async function getPendingRequests(ownerId: string): Promise<AccessRequest[]> {
  const docs = await fsQuery("access_requests", [
    { field: "owner_id", op: "EQUAL", value: ownerId },
  ]);
  return docs.map(toAccessRequest).filter((r) => r.status === "pending");
}

export async function approveRequest(requestId: string): Promise<void> {
  await fsUpdate(`access_requests/${requestId}`, { status: "approved" });
}

export async function denyRequest(requestId: string): Promise<void> {
  await fsUpdate(`access_requests/${requestId}`, { status: "denied" });
}

export async function recordPublishedApp(
  toolId: string,
  ownerEmail: string,
  ownerId: string,
  name: string,
  summary: string
): Promise<void> {
  await fsSet(`published_apps/${toolId}`, { toolId, ownerEmail, ownerId, name, summary });
}
