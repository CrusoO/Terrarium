import { brownieKnowledgeSources, brownieProjects, discoverDemoCandidates, findAsset, getKnowledgeForAsset } from "../mockData";

type BrownieDataCheck = {
  name: string;
  run: () => void;
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export const brownieMockDataChecks: BrownieDataCheck[] = [
  {
    name: "seeds three fictional projects",
    run: () => {
      assert(brownieProjects.length === 3, "Expected exactly three seeded demo projects.");
      assert(
        brownieProjects.every((project) => project.organization.includes(" ") && project.owner.endsWith(".example")),
        "Expected fictional organizations and example-domain owners.",
      );
    },
  },
  {
    name: "seeds a realistic asset inventory",
    run: () => {
      const assetCount = brownieProjects.reduce((count, project) => count + project.assets.length, 0);
      assert(assetCount >= 12, "Expected at least twelve seeded assets.");
      assert(Boolean(findAsset("pm-auth-context")), "Expected AuthContext asset.");
      assert(Boolean(findAsset("commerce-notification-service")), "Expected NotificationService asset.");
      assert(Boolean(findAsset("support-ticket-workflow")), "Expected private support workflow asset.");
    },
  },
  {
    name: "links knowledge sources to assets",
    run: () => {
      assert(brownieKnowledgeSources.length >= 6, "Expected multiple seeded knowledge sources.");
      assert(getKnowledgeForAsset("commerce-notification-service").length > 0, "Expected notification knowledge provenance.");
      assert(getKnowledgeForAsset("support-ticket-workflow").length > 0, "Expected support privacy knowledge provenance.");
    },
  },
  {
    name: "discovers candidates for every demo feature",
    run: () => {
      const featureIds = new Set(discoverDemoCandidates().map((candidate) => candidate.featureId));
      assert(featureIds.has("feature-auth"), "Expected auth candidates.");
      assert(featureIds.has("feature-permissions"), "Expected permission candidates.");
      assert(featureIds.has("feature-notifications"), "Expected notification candidates.");
      assert(featureIds.has("feature-dashboard"), "Expected dashboard candidates.");
    },
  },
];

export function runBrownieMockDataChecks(): void {
  brownieMockDataChecks.forEach((check) => check.run());
}
