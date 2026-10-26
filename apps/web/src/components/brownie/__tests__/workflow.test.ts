import { brownieDemoRequest, buildDemoSnapshot, findAsset, simulateAssetDecision } from "../mockData";

type BrownieWorkflowCheck = {
  name: string;
  run: () => void;
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export const brownieWorkflowChecks: BrownieWorkflowCheck[] = [
  {
    name: "builds the complete scenario snapshot",
    run: () => {
      const snapshot = buildDemoSnapshot();
      assert(snapshot.request.features.length === 4, "Expected four parsed request features.");
      assert(snapshot.candidates.length >= 10, "Expected multiple catalog candidates.");
      assert(snapshot.decisions.length === snapshot.candidates.length, "Expected one decision per candidate.");
      assert(snapshot.verification.length >= 4, "Expected simulated verification checks.");
      assert(snapshot.simulatedFiles.length >= 4, "Expected simulated integration output files.");
    },
  },
  {
    name: "shows distinct decision outcomes",
    run: () => {
      const decisions = buildDemoSnapshot().decisions;
      const outcomes = new Set(decisions.map((decision) => decision.decision));
      assert(outcomes.has("reuse"), "Expected reusable assets.");
      assert(outcomes.has("review_required"), "Expected review-required candidates.");
      assert(outcomes.has("rejected"), "Expected rejected candidates.");
    },
  },
  {
    name: "adapts a partial match instead of reusing it",
    run: () => {
      const asset = findAsset("pm-dashboard-shell");
      assert(Boolean(asset), "Expected the dashboard shell asset.");
      const decision = simulateAssetDecision(
        { id: "partial", name: "Export charts", description: "", keywords: ["dashboard", "metrics", "charts", "export"], requiredStack: "React" },
        asset!,
        brownieDemoRequest.requestingProjectId,
      );
      assert(decision.decision === "adapt", `Expected adapt, got ${decision.decision}.`);
    },
  },
  {
    name: "keeps comparison metrics internally consistent",
    run: () => {
      const snapshot = buildDemoSnapshot();
      const selectedCount = snapshot.decisions.filter((decision) => decision.decision === "reuse").length;
      const adaptedCount = snapshot.decisions.filter((decision) => decision.decision === "adapt").length;
      const rejectedCount = snapshot.decisions.filter((decision) => decision.decision === "rejected").length;
      const reviewCount = snapshot.decisions.filter((decision) => decision.decision === "review_required").length;

      assert(snapshot.comparison.reusedAssets === selectedCount, "Expected reused asset metric to match decisions.");
      assert(snapshot.comparison.adaptedAssets === adaptedCount, "Expected adapted asset metric to match decisions.");
      assert(snapshot.comparison.rejectedCandidates === rejectedCount, "Expected rejected metric to match decisions.");
      assert(snapshot.comparison.reviewCandidates === reviewCount, "Expected review metric to match decisions.");
      assert(snapshot.comparison.note.toLowerCase().includes("simulated"), "Expected metrics to be labeled as simulated.");
    },
  },
];

export function runBrownieWorkflowChecks(): void {
  brownieWorkflowChecks.forEach((check) => check.run());
}
