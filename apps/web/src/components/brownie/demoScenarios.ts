import {
  brownieDemoRequest,
  buildDemoSnapshot,
  discoverDemoCandidates,
  evaluateDemoRequest,
  type BrownieDecision,
  type BrownieDemoSnapshot,
  type BrownieFeature,
} from "./mockData";

export type BrownieBrainStage = {
  title: string;
  detail: string;
  signal: string;
};

export type BrownieBuildScenario = {
  id:
    | "commerce-operations"
    | "sap-purchase-requisition"
    | "sap-inventory-reconciliation"
    | "field-service-work-orders"
    | "general-app";
  name: string;
  shortName: string;
  snapshot: BrownieDemoSnapshot;
  brainStages: BrownieBrainStage[];
};

/** Mock asset ids the worker can hand to codegen as seed files (React builds only). */
export const SEEDED_ASSET_IDS = new Set([
  "pm-auth-context",
  "pm-role-guard",
  "pm-dashboard-shell",
  "commerce-product-card",
  "commerce-notification-service",
]);

/** Asset ids the seed resolver adds automatically, mirrored from brownie_seeds.py. */
export const SEED_DEPENDENCIES: Record<string, string[]> = {
  "pm-role-guard": ["pm-auth-context"],
};

const SEED_PATHS: Record<string, string> = {
  "pm-auth-context": "src/brownie/AuthContext.jsx",
  "pm-role-guard": "src/brownie/RoleGuard.jsx",
  "pm-dashboard-shell": "src/brownie/DashboardShell.jsx",
  "commerce-product-card": "src/brownie/ProductCard.jsx",
  "commerce-notification-service": "src/brownie/notificationService.js",
};

export function chosenDecision(decisions: BrownieDecision[], featureId: string): BrownieDecision | undefined {
  return decisions
    .filter((decision) => decision.featureId === featureId && (decision.decision === "reuse" || decision.decision === "adapt"))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
}

function evaluateScenario(id: string, prompt: string, features: BrownieFeature[], label: string): BrownieDemoSnapshot {
  const base = buildDemoSnapshot();
  const request = { ...brownieDemoRequest, id, prompt, features };
  const candidates = discoverDemoCandidates(request);
  const decisions = evaluateDemoRequest(request);
  const count = (kind: BrownieDecision["decision"]) => decisions.filter((decision) => decision.decision === kind).length;
  const files: BrownieDemoSnapshot["simulatedFiles"] = features.map((feature) => {
    const chosen = chosenDecision(decisions, feature.id);
    if (chosen?.asset && SEEDED_ASSET_IDS.has(chosen.asset.id)) {
      return {
        path: SEED_PATHS[chosen.asset.id],
        source: chosen.decision === "adapt" ? "adapted" : "reused",
        detail: `${chosen.asset.name} v${chosen.asset.version} for ${feature.name}.`,
      };
    }
    return { path: `(generated) ${feature.name}`, source: "generated", detail: "Codegen writes this feature because no approved asset passed the gates." };
  });
  const generatedFeatures = files.filter((file) => file.source === "generated").length;

  return {
    request,
    candidates,
    decisions,
    simulatedFiles: files,
    verification: base.verification.map((check, index) => ({
      ...check,
      id: `${id}-${check.id}`,
      name: index === 0 ? `${label} build contract` : check.name,
      detail: index === 0 ? `Simulated ${label} build check. No real tests were run.` : check.detail,
    })),
    comparison: {
      ...base.comparison,
      reusedAssets: count("reuse"),
      adaptedAssets: count("adapt"),
      generatedFeatures,
      rejectedCandidates: count("rejected"),
      reviewCandidates: count("review_required"),
    },
    auditEvents: base.auditEvents.map((event) => ({
      ...event,
      id: `${id}-${event.id}`,
      detail: event.action === "Request parsed" ? `Extracted ${features.length} capabilities for ${label}.` : event.detail,
    })),
  };
}

function stagesFor(snapshot: BrownieDemoSnapshot): BrownieBrainStage[] {
  const { comparison, request, candidates } = snapshot;
  const covered = request.features.length - comparison.generatedFeatures;
  return [
    { title: "Reading the architecture plan", detail: "Map the planned build to the capabilities Brownie can search for.", signal: `${request.features.length} capabilities` },
    { title: "Searching the reuse catalog", detail: "Look across permitted fictional projects for matching assets.", signal: `${candidates.length} candidates` },
    { title: "Applying trust gates", detail: "Block private assets, deprecated components, incompatible stacks, and anything awaiting approval.", signal: `${comparison.rejectedCandidates + comparison.reviewCandidates} held back` },
    { title: "Choosing reuse vs. generate", detail: "Offer approved matches for reuse; everything else is left for code generation.", signal: `${covered} reusable · ${comparison.generatedFeatures} to generate` },
  ];
}

function scenario(
  meta: Omit<BrownieBuildScenario, "snapshot" | "brainStages">,
  prompt: string,
  features: BrownieFeature[],
): BrownieBuildScenario {
  const snapshot = evaluateScenario(meta.id, prompt, features, meta.shortName);
  return { ...meta, snapshot, brainStages: stagesFor(snapshot) };
}

const signIn = (id: string, name: string): BrownieFeature => ({
  id,
  name,
  description: "People sign in and stay signed in.",
  keywords: ["login", "authentication", "session", "team"],
  requiredStack: "React",
  candidateAssetIds: ["pm-auth-context", "support-agent-assignment"],
});

const roleAccess = (id: string, name: string): BrownieFeature => ({
  id,
  name,
  description: "Each person only sees what their role allows.",
  keywords: ["role", "permission", "guard", "access"],
  requiredStack: "React",
  candidateAssetIds: ["pm-role-guard", "support-ticket-workflow"],
});

const notifications = (id: string, name: string): BrownieFeature => ({
  id,
  name,
  description: "People get a message when something changes.",
  keywords: ["notification", "email", "in-app", "audit"],
  requiredStack: "React",
  candidateAssetIds: ["commerce-notification-service", "pm-notification-banner-legacy"],
});

const dashboard = (id: string, name: string): BrownieFeature => ({
  id,
  name,
  description: "A home screen that shows the numbers that matter.",
  keywords: ["dashboard", "metrics", "cards", "panels"],
  requiredStack: "React",
  candidateAssetIds: ["pm-dashboard-shell", "support-dashboard-angular"],
});

export const brownieBuildScenarios: BrownieBuildScenario[] = [
  scenario(
    {
      id: "commerce-operations",
      name: "Commerce Operations Portal",
      shortName: "Commerce Portal",
    },
    "Build an e-commerce storefront with login, staff permissions, a product catalog, cart and checkout, and order notifications.",
    [
      signIn("commerce-auth", "Customer and staff login"),
      roleAccess("commerce-staff", "Staff permissions"),
      {
        id: "commerce-catalog",
        name: "Product catalog",
        description: "Browse products with prices and stock badges.",
        keywords: ["product", "catalog", "card", "inventory"],
        requiredStack: "React",
        candidateAssetIds: ["commerce-product-card", "support-ticket-card"],
      },
      {
        id: "commerce-checkout",
        name: "Cart, checkout, and orders",
        description: "Cart totals, checkout form, and order history.",
        keywords: ["checkout", "cart", "orders", "payment"],
        requiredStack: "React",
        candidateAssetIds: ["commerce-payment-api-draft", "support-ticket-workflow"],
      },
      notifications("commerce-notifications", "Order notifications"),
    ],
  ),
  scenario(
    {
      id: "sap-purchase-requisition",
      name: "SAP Purchase Requisition Workspace",
      shortName: "SAP Requisition",
    },
    "Build an SAP purchase requisition workspace with requester and approver roles, approval routing, vendor lookup, and a status dashboard.",
    [
      signIn("sap-pr-auth", "Requester sign-in"),
      roleAccess("sap-pr-roles", "Approver role access"),
      {
        id: "sap-pr-form",
        name: "Purchase requisition form",
        description: "Capture material, supplier, cost center, and justification.",
        keywords: ["requisition", "form", "cost center", "supplier"],
        requiredStack: "React",
        candidateAssetIds: ["commerce-product-card", "support-ticket-card"],
      },
      {
        id: "sap-pr-approval",
        name: "Approval workflow",
        description: "Route requests by value and cost center.",
        keywords: ["approval", "workflow", "routing", "threshold"],
        requiredStack: "React",
        candidateAssetIds: ["support-ticket-workflow", "support-agent-assignment"],
      },
      {
        id: "sap-pr-vendor",
        name: "Vendor lookup",
        description: "Search mock vendors by name or number.",
        keywords: ["vendor", "supplier", "lookup", "search"],
        requiredStack: "React",
        candidateAssetIds: ["commerce-webhook-verifier"],
      },
      dashboard("sap-pr-dashboard", "Requisition status dashboard"),
      notifications("sap-pr-notifications", "Approval notifications"),
    ],
  ),
  scenario(
    {
      id: "sap-inventory-reconciliation",
      name: "SAP Inventory Reconciliation Console",
      shortName: "SAP Inventory",
    },
    "Build an SAP inventory reconciliation console with warehouse sign-in, supervisor roles, stock count entry, variance reconciliation, a variance dashboard, and alerts.",
    [
      signIn("sap-inv-auth", "Warehouse sign-in"),
      roleAccess("sap-inv-roles", "Supervisor role access"),
      {
        id: "sap-inv-count",
        name: "Stock count entry",
        description: "Record counted quantities per storage bin.",
        keywords: ["stock", "count", "bin", "quantity"],
        requiredStack: "React",
        candidateAssetIds: ["commerce-product-card", "support-ticket-card"],
      },
      {
        id: "sap-inv-reconcile",
        name: "Reconciliation workflow",
        description: "Review count differences and post approved adjustments.",
        keywords: ["reconciliation", "variance", "adjustment", "posting"],
        requiredStack: "React",
        candidateAssetIds: ["support-ticket-workflow", "support-agent-assignment"],
      },
      dashboard("sap-inv-dashboard", "Variance dashboard"),
      notifications("sap-inv-alerts", "Variance alerts"),
    ],
  ),
  scenario(
    {
      id: "field-service-work-orders",
      name: "Field Service Work Orders",
      shortName: "Field Service",
    },
    "Build a field service work order tracker with dispatcher and technician sign-in, a dispatcher board, today's jobs for technicians, a manager home screen, and customer notifications.",
    [
      signIn("fso-auth", "Dispatcher and technician sign-in"),
      roleAccess("fso-roles", "Dispatcher and technician access"),
      {
        id: "fso-board",
        name: "Dispatcher board",
        description: "See every open work order and assign it to a technician.",
        keywords: ["work order", "dispatch", "assign", "board"],
        requiredStack: "React",
        candidateAssetIds: ["support-ticket-workflow", "support-agent-assignment"],
      },
      dashboard("fso-dashboard", "Manager home screen"),
      notifications("fso-notifications", "Customer on-the-way notifications"),
    ],
  ),
];

const generalScenario = scenario(
  {
    id: "general-app",
    name: "Internal Business App",
    shortName: "Business App",
  },
  brownieDemoRequest.prompt,
  brownieDemoRequest.features,
);

export function findBuildScenario(id: BrownieBuildScenario["id"]): BrownieBuildScenario {
  if (id === generalScenario.id) return generalScenario;
  return brownieBuildScenarios.find((item) => item.id === id) ?? brownieBuildScenarios[0];
}

export function matchScenarioForPrompt(prompt: string): BrownieBuildScenario {
  const text = prompt.toLowerCase();
  const sap = /\bsap\b|\bs\/4|\bhana\b|\bfiori\b|\babap\b/.test(text);
  if ((sap || /\bwarehouse\b/.test(text)) && /inventory|stock|warehouse|cycle count|reconcil/.test(text)) {
    return findBuildScenario("sap-inventory-reconciliation");
  }
  if (sap || /requisition|procure|purchase order|purchase request|\bvendor\b|\bsupplier\b/.test(text)) {
    return findBuildScenario("sap-purchase-requisition");
  }
  if (/work order|field service|technician|dispatch/.test(text)) {
    return findBuildScenario("field-service-work-orders");
  }
  if (/e-?commerce|\bshop\b|\bstore\b|storefront|\bcart\b|checkout|product|catalog|\border/.test(text)) {
    return findBuildScenario("commerce-operations");
  }
  return generalScenario;
}
