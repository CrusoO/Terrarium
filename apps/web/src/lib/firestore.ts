/**
 * Thin Firestore REST client — avoids the WebSocket SDK that Zscaler blocks.
 * Uses plain HTTPS fetch() with the Firebase ID token for auth.
 *
 * Firestore REST docs: https://firebase.google.com/docs/firestore/reference/rest
 */
import { firebaseAuth } from "./firebase";

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID as string;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Token ────────────────────────────────────────────────────────────────────

async function token(): Promise<string> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

// ── Firestore value converters ────────────────────────────────────────────────

type FsValue = Record<string, unknown>;
type FsFields = Record<string, FsValue>;

function toFsValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsValue) } };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  return { mapValue: { fields: toFsFields(v as Record<string, unknown>) } };
}

function toFsFields(obj: Record<string, unknown>): FsFields {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFsValue(v)]));
}

function fromFsValue(v: FsValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) {
    const arr = (v.arrayValue as { values?: FsValue[] }).values ?? [];
    return arr.map(fromFsValue);
  }
  if ("mapValue" in v) {
    const fields = (v.mapValue as { fields?: FsFields }).fields ?? {};
    return fromFsFields(fields);
  }
  return null;
}

function fromFsFields(fields: FsFields): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromFsValue(v)]));
}

function idFromName(name: string): string {
  return name.split("/").pop() ?? name;
}

// ── CRUD helpers ──────────────────────────────────────────────────────────────

async function headers() {
  return { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" };
}

/** Create a document with auto-generated ID. Returns { id, ...data }. */
export async function fsAdd(
  collection: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/${collection}`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ fields: toFsFields(data) }),
  });
  if (!res.ok) throw new Error(`Firestore add failed: ${await res.text()}`);
  const doc = await res.json() as { name: string; fields: FsFields };
  return { id: idFromName(doc.name), ...fromFsFields(doc.fields ?? {}) };
}

/** Create or overwrite a document at a known path. */
export async function fsSet(
  path: string,
  data: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${BASE}/${path}`, {
    method: "PATCH",
    headers: await headers(),
    body: JSON.stringify({ fields: toFsFields(data) }),
  });
  if (!res.ok) throw new Error(`Firestore set failed: ${await res.text()}`);
}

/** Partial update — only the listed fields. */
export async function fsUpdate(
  path: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldPaths = Object.keys(data).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const res = await fetch(`${BASE}/${path}?${fieldPaths}`, {
    method: "PATCH",
    headers: await headers(),
    body: JSON.stringify({ fields: toFsFields(data) }),
  });
  if (!res.ok) throw new Error(`Firestore update failed: ${await res.text()}`);
}

/** Get a single document. Returns null if not found. */
export async function fsGet(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BASE}/${path}`, { headers: await headers() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore get failed: ${await res.text()}`);
  const doc = await res.json() as { name: string; fields?: FsFields };
  return { id: idFromName(doc.name), ...fromFsFields(doc.fields ?? {}) };
}

/** Delete a document. */
export async function fsDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE}/${path}`, { method: "DELETE", headers: await headers() });
  if (!res.ok && res.status !== 404) throw new Error(`Firestore delete failed: ${await res.text()}`);
}

/** List all documents in a collection. */
export async function fsList(collection: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${BASE}/${collection}`, { headers: await headers() });
  if (!res.ok) throw new Error(`Firestore list failed: ${await res.text()}`);
  const body = await res.json() as { documents?: Array<{ name: string; fields?: FsFields }> };
  return (body.documents ?? []).map((d) => ({ id: idFromName(d.name), ...fromFsFields(d.fields ?? {}) }));
}

/** Structured query. Returns matching documents. */
export async function fsQuery(
  collectionId: string,
  filters: Array<{ field: string; op: string; value: unknown }>
): Promise<Record<string, unknown>[]> {
  const where =
    filters.length === 1
      ? {
          fieldFilter: {
            field: { fieldPath: filters[0].field },
            op: filters[0].op,
            value: toFsValue(filters[0].value),
          },
        }
      : {
          compositeFilter: {
            op: "AND",
            filters: filters.map((f) => ({
              fieldFilter: {
                field: { fieldPath: f.field },
                op: f.op,
                value: toFsValue(f.value),
              },
            })),
          },
        };

  const res = await fetch(`${BASE}:runQuery`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where,
      },
    }),
  });
  if (!res.ok) throw new Error(`Firestore query failed: ${await res.text()}`);
  const rows = await res.json() as Array<{ document?: { name: string; fields?: FsFields } }>;
  return rows
    .filter((r) => r.document)
    .map((r) => ({ id: idFromName(r.document!.name), ...fromFsFields(r.document!.fields ?? {}) }));
}
