/**
 * Serializes Phase 7 contract samples with Zod; Python test parses the JSON file.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  acceptanceCheckResultSchema,
  acceptanceCheckSchema,
  changeRequestSchema,
  channelLinkSchema,
  checkCompletedPayloadSchema,
  checkStepPayloadSchema,
  ledgerEntrySchema,
  publishBlockedPayloadSchema,
  remediationAttemptSchema,
  remediationCampaignSchema,
  suppressionSchema,
  toolHealthSchema,
  vulnerabilityFindingSchema,
} from "../packages/contracts/dist/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "packages", "py-contracts", "tests", "fixtures", "phase7-roundtrip.json");

const samples = {
  acceptanceCheck: acceptanceCheckSchema.parse({
    id: "chk-1",
    description: "Adding an expense increases the total",
    steps: ["Open app", "Add expense", "Verify total"],
  }),
  acceptanceCheckResult: acceptanceCheckResultSchema.parse({
    checkId: "chk-1",
    status: "passed",
    durationMs: 1200,
  }),
  vulnerabilityFinding: vulnerabilityFindingSchema.parse({
    id: "find-1",
    toolId: "tool-1",
    versionId: "ver-1",
    source: "osv",
    severity: "high",
    title: "Example advisory",
    advisoryId: "GHSA-xxxx",
    packageName: "lodash",
    installedVersion: "4.17.20",
    fixedVersions: ["4.17.21"],
    reachable: true,
    detectedAt: "2026-01-01T00:00:00.000Z",
  }),
  toolHealth: toolHealthSchema.parse({
    toolId: "tool-1",
    versionId: "ver-1",
    fileMapHash: "abc123",
    vulnDbVersion: "2026-01-01",
    status: "healthy",
    checkedAt: "2026-01-01T00:00:00.000Z",
    tests: { passed: 5, total: 5, failedIds: [] },
    attacks: { attempted: 7, succeeded: 0, notApplicable: ["idor:no-users"] },
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
    secretsFound: 0,
    codeIssues: 0,
    activeSuppressions: 0,
    blockingReasons: [],
    warnings: [],
  }),
  remediationAttempt: remediationAttemptSchema.parse({
    findingId: "find-1",
    strategy: "patch_upgrade",
    attempt: 1,
    outcome: "fixed",
    checksPassed: 5,
    checksTotal: 5,
    rescanClean: true,
  }),
  suppression: suppressionSchema.parse({
    findingId: "find-2",
    reason: "Dev dependency not shipped",
    approvedBy: "owner-1",
    expiresAt: "2026-04-01T00:00:00.000Z",
  }),
  remediationCampaign: remediationCampaignSchema.parse({
    id: "camp-1",
    advisoryId: "GHSA-xxxx",
    toolIds: ["t1", "t2"],
    canaryToolId: "t1",
    fixed: 1,
    failed: 0,
    pendingApproval: 0,
  }),
  ledgerEntry: ledgerEntrySchema.parse({
    id: "led-1",
    toolId: "tool-1",
    at: "2026-01-01T00:00:00.000Z",
    kind: "detected",
    findingId: "find-1",
    detail: "OSV high in lodash",
  }),
  changeRequest: changeRequestSchema.parse({
    id: "cr-1",
    channel: "whatsapp",
    externalMessageId: "msg-1",
    actorId: "user-1",
    text: "Add dark mode",
    status: "queued",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }),
  channelLink: channelLinkSchema.parse({
    actorId: "user-1",
    channel: "whatsapp",
    address: "+15551234567",
    verifiedAt: "2026-01-01T00:00:00.000Z",
  }),
  checkStepPayload: checkStepPayloadSchema.parse({
    step: "tests",
    status: "running",
  }),
  checkCompletedPayload: checkCompletedPayloadSchema.parse({
    health: toolHealthSchema.parse({
      toolId: "tool-1",
      versionId: "ver-1",
      fileMapHash: "abc123",
      vulnDbVersion: "2026-01-01",
      status: "warning",
      checkedAt: "2026-01-01T00:00:00.000Z",
      tests: { passed: 5, total: 5, failedIds: [] },
      attacks: { attempted: 0, succeeded: 0, notApplicable: [] },
      vulnerabilities: { critical: 0, high: 0, medium: 1, low: 0 },
      secretsFound: 0,
      codeIssues: 0,
      activeSuppressions: 0,
      blockingReasons: [],
      warnings: ["1 medium dependency issue"],
    }),
  }),
  publishBlockedPayload: publishBlockedPayloadSchema.parse({
    blockingReasons: ["1 high severity finding"],
  }),
};

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(samples, null, 2), "utf8");
console.log(`Wrote ${outPath}`);
