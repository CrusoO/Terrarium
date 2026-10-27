/**
 * Brownie catalog backed by fictional projects published to the user's dashboard.
 * Sync is idempotent: it publishes the projects once and adds a version only when their files change.
 */
import { getAuthHeaders, refreshAuthToken } from "./auth";

export interface BrownieCatalogProject {
  key: string;
  name: string;
  organization: string;
  stack: string;
  version: string;
  toolId: string | null;
  toolVersion: number | null;
  fileCount: number;
  published: boolean;
  trust?: { score: number; grade: string; status: "healthy" | "attention" | "unsafe" } | null;
}

export interface BrownieCatalogAsset {
  id: string;
  name: string;
  version: string;
  projectKey: string;
  toolId: string | null;
  toolName: string;
  toolVersion: number | null;
  files: { path: string; sha256: string | null }[];
  dependsOn: string[];
  stack?: string;
  reusable: boolean;
  gateReason: string;
  trustBlocked?: boolean;
}

export interface BrownieCatalog {
  simulated: true;
  projects: BrownieCatalogProject[];
  assets: BrownieCatalogAsset[];
}

export interface BrownieRecommendation {
  source: "dashboard-catalog";
  simulated: true;
  checkedProjects: Pick<BrownieCatalogProject, "name" | "toolVersion" | "stack" | "fileCount">[];
  recommended: {
    assetId: string;
    name: string;
    projectKey: string;
    toolName: string;
    toolVersion: number | null;
    files: { path: string; sha256: string | null }[];
    score: number;
    matchedTerms: string[];
    reason: string;
  }[];
  recommendedAssetIds: string[];
  heldBack: {
    assetId: string;
    name: string;
    projectKey: string;
    toolName: string;
    toolVersion: number | null;
    files: { path: string; sha256: string | null }[];
    score: number;
    matchedTerms: string[];
    reason: string;
    trustBlocked?: boolean;
  }[];
  domain?: string | null;
  message: string;
}

export interface BrownieProvenance {
  assetId: string;
  name: string;
  version: string;
  projectName: string;
  organization: string;
  toolId: string;
  toolName: string;
  toolVersion: number;
  files: { source: string; target: string; sha256: string }[];
}

let pending: Promise<BrownieCatalog> | null = null;

export function syncBrownieCatalog(): Promise<BrownieCatalog> {
  pending ??= (async () => {
    await refreshAuthToken();
    const response = await fetch("/brownie/catalog/sync", { method: "POST", headers: getAuthHeaders() });
    const json = (await response.json().catch(() => null)) as BrownieCatalog | { detail?: string } | null;
    if (!response.ok || !json || !("assets" in json)) {
      const detail = json && "detail" in json && typeof json.detail === "string" ? json.detail : "";
      throw new Error(detail || `Could not load the Brownie catalog (${response.status}).`);
    }
    return json;
  })().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

export function parseProvenance(value: unknown): BrownieProvenance[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is BrownieProvenance =>
      Boolean(entry) && typeof entry === "object" && typeof (entry as BrownieProvenance).assetId === "string" && Array.isArray((entry as BrownieProvenance).files)
  );
}

export function parseRecommendation(value: unknown): BrownieRecommendation | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<BrownieRecommendation>;
  if (
    candidate.source !== "dashboard-catalog" ||
    !Array.isArray(candidate.checkedProjects) ||
    !Array.isArray(candidate.recommended) ||
    !Array.isArray(candidate.recommendedAssetIds)
  ) {
    return undefined;
  }
  return candidate as BrownieRecommendation;
}
