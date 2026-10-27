import {
  brownieDemoRequest,
  evaluateDemoRequest,
  findAsset,
  simulateAssetDecision,
  type BrownieAsset,
} from "../mockData";

type BrownieDecisionCheck = {
  name: string;
  run: () => void;
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assetOrThrow(assetId: string): BrownieAsset {
  const asset = findAsset(assetId);
  if (!asset) {
    throw new Error(`Missing seeded asset ${assetId}`);
  }
  return asset;
}

const authFeature = brownieDemoRequest.features.find((feature) => feature.id === "feature-auth");
const permissionFeature = brownieDemoRequest.features.find((feature) => feature.id === "feature-permissions");
const notificationFeature = brownieDemoRequest.features.find((feature) => feature.id === "feature-notifications");

if (!authFeature || !permissionFeature || !notificationFeature) {
  throw new Error("Brownie demo request is missing required seeded features.");
}

export const brownieDecisionChecks: BrownieDecisionCheck[] = [
  {
    name: "reuses approved high-relevance auth asset",
    run: () => {
      const decision = simulateAssetDecision(authFeature, assetOrThrow("pm-auth-context"), brownieDemoRequest.requestingProjectId);
      assert(decision.decision === "reuse", "Expected AuthContext to be reusable.");
      assert(decision.relevanceScore >= 0.86, "Expected AuthContext relevance to meet the reuse threshold.");
      assert(decision.verificationResult === "passed", "Expected approved auth evidence to pass.");
    },
  },
  {
    name: "rejects private assets from other organizations",
    run: () => {
      const decision = simulateAssetDecision(
        permissionFeature,
        assetOrThrow("support-ticket-workflow"),
        brownieDemoRequest.requestingProjectId,
      );
      assert(decision.decision === "rejected", "Expected private support workflow to be rejected.");
      assert(decision.permissionResult === "blocked", "Expected private support workflow permission to be blocked.");
    },
  },
  {
    name: "rejects deprecated assets with known issues",
    run: () => {
      const decision = simulateAssetDecision(
        notificationFeature,
        assetOrThrow("pm-notification-banner-legacy"),
        brownieDemoRequest.requestingProjectId,
      );
      assert(decision.decision === "rejected", "Expected legacy notification banner to be rejected.");
      assert(decision.explanation.includes("deprecated"), "Expected deprecated explanation for legacy notification banner.");
      assert(decision.evidence.some((item) => item.includes("Leaked interval")), "Expected known issue evidence.");
    },
  },
  {
    name: "requires review for pending approval assets",
    run: () => {
      const decision = simulateAssetDecision(authFeature, assetOrThrow("commerce-payment-api-draft"), brownieDemoRequest.requestingProjectId);
      assert(decision.decision === "review_required", "Expected draft payment API to require review.");
      assert(decision.approvalResult === "pending_review", "Expected pending approval status to be surfaced.");
    },
  },
  {
    name: "requires review for stale evidence",
    run: () => {
      const staleAuthAsset: BrownieAsset = {
        ...assetOrThrow("pm-auth-context"),
        id: "pm-auth-context-stale-check",
        testsLastRun: "2026-01-01",
      };
      const decision = simulateAssetDecision(authFeature, staleAuthAsset, brownieDemoRequest.requestingProjectId);
      assert(decision.decision === "review_required", "Expected stale evidence to require review.");
      assert(decision.freshnessResult === "stale", "Expected stale freshness result.");
    },
  },
  {
    name: "rejects incompatible technology stacks",
    run: () => {
      const decision = simulateAssetDecision(
        authFeature,
        assetOrThrow("support-dashboard-angular"),
        brownieDemoRequest.requestingProjectId,
      );
      assert(decision.decision === "rejected", "Expected Angular dashboard to be rejected for React auth request.");
      assert(decision.compatibilityScore < 0.5, "Expected incompatible stack score.");
    },
  },
  {
    name: "produces deterministic scenario outcomes",
    run: () => {
      const decisions = evaluateDemoRequest();
      assert(decisions.some((decision) => decision.asset?.id === "pm-auth-context" && decision.decision === "reuse"), "Expected auth reuse.");
      assert(
        decisions.some((decision) => decision.asset?.id === "pm-notification-banner-legacy" && decision.decision === "rejected"),
        "Expected deprecated notification rejection.",
      );
      assert(
        decisions.some((decision) => decision.asset?.id === "support-ticket-workflow" && decision.permissionResult === "blocked"),
        "Expected private support asset to be blocked.",
      );
    },
  },
];

export function runBrownieDecisionChecks(): void {
  brownieDecisionChecks.forEach((check) => check.run());
}
