export type BrownieVisibility = "all" | "internal" | "private";
export type BrownieApprovalStatus = "approved" | "pending_review" | "deprecated" | "unapproved";
export type BrownieAssetType = "component" | "service" | "middleware" | "api" | "logic" | "documentation";
export type BrownieDecisionType = "reuse" | "adapt" | "review_required" | "rejected" | "generate";
export type KnowledgeSourceType = "confluence" | "teams" | "architecture_decision" | "api_documentation" | "engineering_standard" | "testing_note";

export type BrownieAsset = {
  id: string;
  projectId: string;
  name: string;
  type: BrownieAssetType;
  path: string;
  description: string;
  tags: string[];
  approvalStatus: BrownieApprovalStatus;
  visibility: BrownieVisibility;
  compatibleStacks: string[];
  version: string;
  lastUpdated: string;
  testsLastRun: string;
  testCoverage: number;
  testsPassed: number;
  testsFailed: number;
  usageCount: number;
  dependencies: string[];
  approvedBy?: string;
  approvedDate?: string;
  submittedBy?: string;
  submittedDate?: string;
  reviewers?: string[];
  knownIssues?: string[];
  deprecatedSince?: string;
  replacedBy?: string;
  permissionNotes: string;
};

export type BrownieProject = {
  id: string;
  name: string;
  organization: string;
  owner: string;
  visibility: BrownieVisibility;
  version: string;
  technologyStack: string[];
  lastUpdated: string;
  status: "active" | "maintenance";
  summary: string;
  permissions: {
    discoverable: boolean;
    readable: boolean;
    reusable: boolean;
    executable: boolean;
    promotable: boolean;
  };
  assets: BrownieAsset[];
};

export type BrownieKnowledgeSource = {
  id: string;
  type: KnowledgeSourceType;
  title: string;
  projectId: string;
  sourceName: string;
  timestamp: string;
  author: string;
  excerpt: string;
  relatedAssets: string[];
};

export type BrownieCandidate = BrownieAsset & {
  featureId: string;
  featureName: string;
  relevanceScore: number;
};

export type BrownieDecision = {
  id: string;
  featureId: string;
  featureName: string;
  asset?: BrownieAsset;
  decision: BrownieDecisionType;
  relevanceScore: number;
  compatibilityScore: number;
  permissionResult: "allowed" | "blocked" | "limited";
  approvalResult: BrownieApprovalStatus | "not_applicable";
  freshnessResult: "fresh" | "stale" | "not_applicable";
  verificationResult: "passed" | "failed" | "needs_rerun" | "not_applicable";
  explanation: string;
  evidence: string[];
};

export type BrownieFeature = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  requiredStack: string;
  candidateAssetIds?: string[];
};

export type BrownieDemoRequest = {
  id: string;
  prompt: string;
  requestingProjectId: string;
  requiredStack: string;
  features: BrownieFeature[];
};

export type VerificationCheck = {
  id: string;
  name: string;
  status: "passed" | "failed" | "fixed";
  durationMs: number;
  detail: string;
};

export type BrownieComparisonMetrics = {
  brownieCostUsd: number;
  generationOnlyCostUsd: number;
  brownieTimeSeconds: number;
  generationOnlyTimeSeconds: number;
  reusedAssets: number;
  adaptedAssets: number;
  generatedFeatures: number;
  rejectedCandidates: number;
  reviewCandidates: number;
  verificationPassRate: number;
  note: string;
};

export type BrownieDemoSnapshot = {
  request: BrownieDemoRequest;
  candidates: BrownieCandidate[];
  decisions: BrownieDecision[];
  verification: VerificationCheck[];
  comparison: BrownieComparisonMetrics;
  simulatedFiles: Array<{ path: string; source: "reused" | "adapted" | "generated"; detail: string }>;
  auditEvents: Array<{ id: string; timestamp: string; actor: string; action: string; detail: string }>;
};

export const brownieProjects: BrownieProject[] = [
  {
    id: "project-a-internal-pm",
    name: "Acme Field Operations · Internal PM",
    organization: "Acme Field Operations",
    owner: "maya.chen@acme-field.example",
    visibility: "internal",
    version: "2.3.1",
    technologyStack: ["React", "TypeScript", "Firebase", "MUI"],
    lastUpdated: "2026-09-30",
    status: "active",
    summary: "Internal project management workspace with role-based task boards, dashboards, and team notifications.",
    permissions: { discoverable: true, readable: true, reusable: true, executable: true, promotable: true },
    assets: [
      {
        id: "pm-auth-context",
        projectId: "project-a-internal-pm",
        name: "AuthContext",
        type: "component",
        path: "src/auth/AuthContext.jsx",
        description: "Firebase login state provider with team membership claims and session guards.",
        tags: ["login", "authentication", "firebase", "team", "permissions"],
        approvalStatus: "approved",
        visibility: "all",
        compatibleStacks: ["React", "TypeScript", "Firebase"],
        version: "2.3.1",
        lastUpdated: "2026-09-22",
        testsLastRun: "2026-09-27",
        testCoverage: 94,
        testsPassed: 24,
        testsFailed: 0,
        usageCount: 12,
        dependencies: ["firebase", "react"],
        approvedBy: "security-review-board",
        approvedDate: "2026-09-24",
        permissionNotes: "Reusable by internal Terrarium workspaces with Firebase auth enabled.",
      },
      {
        id: "pm-role-guard",
        projectId: "project-a-internal-pm",
        name: "RoleGuard",
        type: "component",
        path: "src/auth/RoleGuard.jsx",
        description: "Component-level role guard for admin, manager, contributor, and viewer access.",
        tags: ["role", "permission", "team", "guard", "access"],
        approvalStatus: "approved",
        visibility: "all",
        compatibleStacks: ["React", "TypeScript", "Firebase"],
        version: "2.1.0",
        lastUpdated: "2026-08-18",
        testsLastRun: "2026-09-20",
        testCoverage: 89,
        testsPassed: 18,
        testsFailed: 0,
        usageCount: 15,
        dependencies: ["react"],
        approvedBy: "platform-architecture",
        approvedDate: "2026-08-21",
        permissionNotes: "Approved for reuse when the host app uses the shared team role model.",
      },
      {
        id: "pm-dashboard-shell",
        projectId: "project-a-internal-pm",
        name: "ProjectDashboardShell",
        type: "component",
        path: "src/dashboard/ProjectDashboardShell.jsx",
        description: "Responsive dashboard shell with task metrics, team workload cards, and project health panels.",
        tags: ["dashboard", "project", "tasks", "metrics", "team"],
        approvalStatus: "approved",
        visibility: "all",
        compatibleStacks: ["React", "TypeScript", "MUI"],
        version: "1.8.4",
        lastUpdated: "2026-08-29",
        testsLastRun: "2026-09-02",
        testCoverage: 76,
        testsPassed: 16,
        testsFailed: 0,
        usageCount: 7,
        dependencies: ["@mui/material", "react"],
        approvedBy: "ux-systems",
        approvedDate: "2026-09-04",
        permissionNotes: "Reusable after copy review of dashboard labels and metric definitions.",
      },
      {
        id: "pm-notification-banner-legacy",
        projectId: "project-a-internal-pm",
        name: "NotificationBannerLegacy",
        type: "component",
        path: "src/notifications/NotificationBannerLegacy.jsx",
        description: "Older notification banner for task reminders and project status updates.",
        tags: ["notification", "alerts", "task", "reminder"],
        approvalStatus: "deprecated",
        visibility: "internal",
        compatibleStacks: ["React", "TypeScript"],
        version: "0.9.2",
        lastUpdated: "2025-12-11",
        testsLastRun: "2026-01-08",
        testCoverage: 58,
        testsPassed: 8,
        testsFailed: 2,
        usageCount: 3,
        dependencies: ["react"],
        knownIssues: ["Leaked interval subscriptions after unmount", "Does not announce updates to screen readers"],
        deprecatedSince: "2026-03-14",
        replacedBy: "commerce-notification-service",
        permissionNotes: "Visible for provenance only. Deprecated assets cannot be reused automatically.",
      },
    ],
  },
  {
    id: "project-b-commerce",
    name: "Northstar Retail Labs · Commerce",
    organization: "Northstar Retail Labs",
    owner: "platform@northstar-retail.example",
    visibility: "internal",
    version: "4.6.0",
    technologyStack: ["React", "TypeScript", "Express", "PostgreSQL"],
    lastUpdated: "2026-10-05",
    status: "active",
    summary: "Commerce platform with product catalog, order tracking, customer notifications, and webhook verification.",
    permissions: { discoverable: true, readable: true, reusable: true, executable: true, promotable: false },
    assets: [
      {
        id: "commerce-product-card",
        projectId: "project-b-commerce",
        name: "ProductCard",
        type: "component",
        path: "frontend/src/catalog/ProductCard.jsx",
        description: "Merchandising card with pricing, promotions, and inventory badges.",
        tags: ["catalog", "product", "commerce", "card"],
        approvalStatus: "approved",
        visibility: "all",
        compatibleStacks: ["React", "TypeScript", "MUI"],
        version: "3.4.2",
        lastUpdated: "2026-09-18",
        testsLastRun: "2026-09-19",
        testCoverage: 91,
        testsPassed: 32,
        testsFailed: 0,
        usageCount: 19,
        dependencies: ["@mui/material", "react"],
        approvedBy: "commerce-ui-review",
        approvedDate: "2026-09-19",
        permissionNotes: "Approved reusable UI component, but not relevant to the project tracker request.",
      },
      {
        id: "commerce-notification-service",
        projectId: "project-b-commerce",
        name: "NotificationService",
        type: "service",
        path: "frontend/src/services/notificationService.js",
        description: "Email and in-app notification abstraction with templates, retries, and audit logging.",
        tags: ["notification", "email", "in-app", "retry", "audit"],
        approvalStatus: "approved",
        visibility: "all",
        compatibleStacks: ["React", "TypeScript", "Express"],
        version: "2.5.0",
        lastUpdated: "2026-09-28",
        testsLastRun: "2026-10-01",
        testCoverage: 88,
        testsPassed: 27,
        testsFailed: 0,
        usageCount: 9,
        dependencies: ["zod"],
        approvedBy: "platform-architecture",
        approvedDate: "2026-10-02",
        permissionNotes: "Reusable for internal apps after adapting notification templates.",
      },
      {
        id: "commerce-webhook-verifier",
        projectId: "project-b-commerce",
        name: "WebhookVerifier",
        type: "middleware",
        path: "backend/src/middleware/verifySignature.js",
        description: "Express middleware that verifies HMAC signatures and request freshness for webhooks.",
        tags: ["webhook", "signature", "security", "api", "express"],
        approvalStatus: "approved",
        visibility: "all",
        compatibleStacks: ["Express", "TypeScript"],
        version: "1.6.3",
        lastUpdated: "2026-08-04",
        testsLastRun: "2026-08-05",
        testCoverage: 95,
        testsPassed: 41,
        testsFailed: 0,
        usageCount: 14,
        dependencies: ["crypto"],
        approvedBy: "security-review-board",
        approvedDate: "2026-08-06",
        permissionNotes: "Approved for API services that need signed webhook verification.",
      },
      {
        id: "commerce-payment-api-draft",
        projectId: "project-b-commerce",
        name: "PaymentAPI",
        type: "api",
        path: "backend/src/routes/payments.draft.js",
        description: "Draft payment and refund endpoints with order reconciliation events.",
        tags: ["payment", "orders", "api", "refund"],
        approvalStatus: "pending_review",
        visibility: "internal",
        compatibleStacks: ["Express", "TypeScript", "PostgreSQL"],
        version: "0.7.0",
        lastUpdated: "2026-10-03",
        testsLastRun: "2026-10-04",
        testCoverage: 72,
        testsPassed: 21,
        testsFailed: 1,
        usageCount: 0,
        dependencies: ["express", "zod"],
        submittedBy: "alex.rivera@northstar-retail.example",
        submittedDate: "2026-10-03",
        reviewers: ["security-review-board", "payments-compliance"],
        permissionNotes: "Discoverable but not reusable until payment compliance review is complete.",
      },
    ],
  },
  {
    id: "project-c-support",
    name: "Helio Support Systems · Support Desk",
    organization: "Helio Support Systems",
    owner: "support-platform@helio-support.example",
    visibility: "private",
    version: "1.9.5",
    technologyStack: ["Angular", "TypeScript", "NestJS"],
    lastUpdated: "2026-08-21",
    status: "active",
    summary: "Customer support platform with ticket routing, assignment workflows, and support dashboards.",
    permissions: { discoverable: true, readable: false, reusable: false, executable: false, promotable: false },
    assets: [
      {
        id: "support-ticket-workflow",
        projectId: "project-c-support",
        name: "TicketWorkflow",
        type: "logic",
        path: "src/app/tickets/workflow.ts",
        description: "Ticket state machine for triage, assignment, escalation, and resolution.",
        tags: ["ticket", "workflow", "assignment", "support", "team"],
        approvalStatus: "approved",
        visibility: "private",
        compatibleStacks: ["Angular", "NestJS", "TypeScript"],
        version: "1.9.5",
        lastUpdated: "2026-08-18",
        testsLastRun: "2026-08-20",
        testCoverage: 82,
        testsPassed: 34,
        testsFailed: 0,
        usageCount: 5,
        dependencies: ["rxjs"],
        approvedBy: "support-domain-council",
        approvedDate: "2026-08-20",
        permissionNotes: "Private to Helio Support Systems because it contains support operating model details.",
      },
      {
        id: "support-agent-assignment",
        projectId: "project-c-support",
        name: "AgentAssignmentRules",
        type: "logic",
        path: "src/app/assignment/agent-assignment-rules.ts",
        description: "Role and availability-based assignment rules for support agents.",
        tags: ["assignment", "role", "team", "permissions", "support"],
        approvalStatus: "approved",
        visibility: "private",
        compatibleStacks: ["TypeScript", "NestJS"],
        version: "1.4.0",
        lastUpdated: "2026-07-06",
        testsLastRun: "2026-07-07",
        testCoverage: 86,
        testsPassed: 29,
        testsFailed: 0,
        usageCount: 4,
        dependencies: ["date-fns"],
        approvedBy: "support-domain-council",
        approvedDate: "2026-07-08",
        permissionNotes: "Private domain logic. Brownie can record that it existed, but cannot inspect or reuse it.",
      },
      {
        id: "support-dashboard-angular",
        projectId: "project-c-support",
        name: "SupportDashboardAngular",
        type: "component",
        path: "src/app/dashboards/support-dashboard.component.ts",
        description: "Angular support dashboard with SLA queues and agent workload charts.",
        tags: ["dashboard", "support", "sla", "queue"],
        approvalStatus: "approved",
        visibility: "internal",
        compatibleStacks: ["Angular", "TypeScript"],
        version: "1.1.2",
        lastUpdated: "2026-02-11",
        testsLastRun: "2026-02-12",
        testCoverage: 79,
        testsPassed: 22,
        testsFailed: 0,
        usageCount: 2,
        dependencies: ["@angular/core"],
        approvedBy: "support-ui-review",
        approvedDate: "2026-02-13",
        permissionNotes: "Internal visibility, but incompatible with React apps and has stale evidence.",
      },
      {
        id: "support-ticket-card",
        projectId: "project-c-support",
        name: "TicketCard",
        type: "component",
        path: "src/app/tickets/ticket-card.component.ts",
        description: "Compact ticket card for priority, owner, and SLA status.",
        tags: ["ticket", "card", "priority", "sla"],
        approvalStatus: "unapproved",
        visibility: "internal",
        compatibleStacks: ["Angular", "TypeScript"],
        version: "0.4.0",
        lastUpdated: "2026-05-01",
        testsLastRun: "2026-05-02",
        testCoverage: 61,
        testsPassed: 9,
        testsFailed: 2,
        usageCount: 0,
        dependencies: ["@angular/core"],
        permissionNotes: "Prototype asset that has not passed UI or accessibility review.",
      },
    ],
  },
];

export const brownieKnowledgeSources: BrownieKnowledgeSource[] = [
  {
    id: "adr-role-access",
    type: "architecture_decision",
    title: "ADR-005: Team Role Claims",
    projectId: "project-a-internal-pm",
    sourceName: "Architecture Decision Record",
    timestamp: "2026-07-15T10:00:00Z",
    author: "maya.chen@acme-field.example",
    excerpt: "Team permissions should be resolved from Firebase custom claims and checked in UI guards before rendering restricted project actions.",
    relatedAssets: ["pm-auth-context", "pm-role-guard"],
  },
  {
    id: "teams-notification-leak",
    type: "teams",
    title: "Notification banner memory leak follow-up",
    projectId: "project-a-internal-pm",
    sourceName: "Teams: Project PM Engineering",
    timestamp: "2026-03-12T16:35:00Z",
    author: "jordan.patel@acme-field.example",
    excerpt: "The legacy banner keeps intervals alive after route changes. Do not reuse it; move new work to the shared NotificationService adapter.",
    relatedAssets: ["pm-notification-banner-legacy", "commerce-notification-service"],
  },
  {
    id: "confluence-notification-standards",
    type: "confluence",
    title: "Notification Template Standards",
    projectId: "project-b-commerce",
    sourceName: "Confluence: Platform Standards",
    timestamp: "2026-09-29T08:20:00Z",
    author: "platform@northstar-retail.example",
    excerpt: "Reusable notifications must include retry metadata, user-facing copy ownership, and an audit event for every delivery attempt.",
    relatedAssets: ["commerce-notification-service"],
  },
  {
    id: "api-webhook-security",
    type: "api_documentation",
    title: "Webhook Security Requirements",
    projectId: "project-b-commerce",
    sourceName: "API Docs: Commerce Webhooks",
    timestamp: "2026-08-07T13:15:00Z",
    author: "security-review-board",
    excerpt: "Webhook handlers must verify HMAC signatures, reject stale timestamps, and log signature failures without storing secrets.",
    relatedAssets: ["commerce-webhook-verifier"],
  },
  {
    id: "testing-dashboard-note",
    type: "testing_note",
    title: "Dashboard Loading State Test Note",
    projectId: "project-a-internal-pm",
    sourceName: "QA Notes",
    timestamp: "2026-09-03T09:45:00Z",
    author: "qa@acme-field.example",
    excerpt: "Dashboard shell tests cover metrics, empty task lists, and permission-gated team cards. Loading skeleton coverage is intentionally light.",
    relatedAssets: ["pm-dashboard-shell"],
  },
  {
    id: "support-privacy-standard",
    type: "engineering_standard",
    title: "Support Workflow Privacy Boundary",
    projectId: "project-c-support",
    sourceName: "Engineering Standards",
    timestamp: "2026-07-10T11:40:00Z",
    author: "support-platform@helio-support.example",
    excerpt: "Ticket assignment rules are private domain logic and cannot be exported outside Helio Support Systems without owner approval.",
    relatedAssets: ["support-ticket-workflow", "support-agent-assignment"],
  },
];

export const brownieDemoRequest: BrownieDemoRequest = {
  id: "internal-project-tracker",
  requestingProjectId: "project-a-internal-pm",
  requiredStack: "React",
  prompt:
    "Build an internal project tracker with login, team permissions, notifications, and a dashboard. Reuse approved components from permitted projects when they are suitable, generate missing functionality, and show provenance and verification results.",
  features: [
    {
      id: "feature-auth",
      name: "Login and authentication",
      description: "Allow users to sign in and resolve their team membership.",
      keywords: ["login", "authentication", "firebase", "team"],
      requiredStack: "React",
    },
    {
      id: "feature-permissions",
      name: "Team permissions",
      description: "Gate project actions by role and team access.",
      keywords: ["team", "permissions", "role", "guard", "access"],
      requiredStack: "React",
    },
    {
      id: "feature-notifications",
      name: "Notifications",
      description: "Send and display task, assignment, and status notifications.",
      keywords: ["notification", "task", "email", "in-app", "audit"],
      requiredStack: "React",
    },
    {
      id: "feature-dashboard",
      name: "Project dashboard",
      description: "Show project health, task status, team workload, and metrics.",
      keywords: ["project", "dashboard", "tasks", "metrics", "team"],
      requiredStack: "React",
    },
  ],
};

const scenarioCandidateIds: Record<string, string[]> = {
  "feature-auth": ["pm-auth-context", "support-agent-assignment", "commerce-payment-api-draft"],
  "feature-permissions": ["pm-role-guard", "support-agent-assignment", "support-ticket-workflow"],
  "feature-notifications": ["commerce-notification-service", "pm-notification-banner-legacy", "support-ticket-card"],
  "feature-dashboard": ["pm-dashboard-shell", "support-dashboard-angular", "commerce-product-card"],
};

export function getAllAssets(): BrownieAsset[] {
  return brownieProjects.flatMap((project) => project.assets);
}

export function findAsset(assetId: string): BrownieAsset | undefined {
  return getAllAssets().find((asset) => asset.id === assetId);
}

export function findProject(projectId: string): BrownieProject | undefined {
  return brownieProjects.find((project) => project.id === projectId);
}

export function getKnowledgeForAsset(assetId: string): BrownieKnowledgeSource[] {
  return brownieKnowledgeSources.filter((source) => source.relatedAssets.includes(assetId));
}

export function calculateMockSimilarity(feature: BrownieFeature, asset: BrownieAsset): number {
  const target = [asset.name, asset.description, ...asset.tags].join(" ").toLowerCase();
  const matches = feature.keywords.filter((keyword) => target.includes(keyword.toLowerCase())).length;
  const base = matches / feature.keywords.length;
  const stackBoost = asset.compatibleStacks.includes(feature.requiredStack) ? 0.12 : 0;
  return Math.min(0.97, Number((base + stackBoost).toFixed(2)));
}

function freshnessFor(asset: BrownieAsset): "fresh" | "stale" {
  const testRun = new Date(asset.testsLastRun).getTime();
  const reference = new Date("2026-10-22T00:00:00Z").getTime();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  return reference - testRun > ninetyDaysMs ? "stale" : "fresh";
}

function canReadAsset(asset: BrownieAsset, requestingProjectId: string): "allowed" | "blocked" | "limited" {
  if (asset.visibility === "private" && asset.projectId !== requestingProjectId) {
    return "blocked";
  }
  if (asset.visibility === "internal" && asset.projectId !== requestingProjectId) {
    return "limited";
  }
  return "allowed";
}

export function simulateAssetDecision(
  feature: BrownieFeature,
  asset: BrownieAsset,
  requestingProjectId: string,
): BrownieDecision {
  const relevanceScore = calculateMockSimilarity(feature, asset);
  const permissionResult = canReadAsset(asset, requestingProjectId);
  const freshnessResult = freshnessFor(asset);
  const compatible = asset.compatibleStacks.includes(feature.requiredStack);
  const compatibilityScore = compatible ? 0.95 : 0.25;
  const evidence = [
    `${asset.testsPassed}/${asset.testsPassed + asset.testsFailed} seeded tests passed`,
    `${asset.testCoverage}% simulated coverage`,
    `Last verification: ${asset.testsLastRun}`,
  ];

  if (permissionResult === "blocked") {
    return {
      id: `${feature.id}-${asset.id}`,
      featureId: feature.id,
      featureName: feature.name,
      asset,
      decision: "rejected",
      relevanceScore,
      compatibilityScore,
      permissionResult,
      approvalResult: asset.approvalStatus,
      freshnessResult,
      verificationResult: "not_applicable",
      explanation: "Rejected because the asset is private to another organization and cannot be inspected or reused.",
      evidence: [asset.permissionNotes],
    };
  }

  if (asset.approvalStatus === "deprecated") {
    return {
      id: `${feature.id}-${asset.id}`,
      featureId: feature.id,
      featureName: feature.name,
      asset,
      decision: "rejected",
      relevanceScore,
      compatibilityScore,
      permissionResult,
      approvalResult: asset.approvalStatus,
      freshnessResult,
      verificationResult: asset.testsFailed > 0 ? "failed" : "needs_rerun",
      explanation: `Rejected because ${asset.name} is deprecated${asset.replacedBy ? ` and replaced by ${asset.replacedBy}` : ""}.`,
      evidence: [...(asset.knownIssues ?? []), ...evidence],
    };
  }

  if (asset.approvalStatus === "pending_review" || asset.approvalStatus === "unapproved") {
    return {
      id: `${feature.id}-${asset.id}`,
      featureId: feature.id,
      featureName: feature.name,
      asset,
      decision: "review_required",
      relevanceScore,
      compatibilityScore,
      permissionResult,
      approvalResult: asset.approvalStatus,
      freshnessResult,
      verificationResult: asset.testsFailed > 0 ? "failed" : "needs_rerun",
      explanation: "Flagged for review because the asset has not been approved for automatic reuse.",
      evidence: [asset.permissionNotes, ...evidence],
    };
  }

  if (!compatible) {
    return {
      id: `${feature.id}-${asset.id}`,
      featureId: feature.id,
      featureName: feature.name,
      asset,
      decision: "rejected",
      relevanceScore,
      compatibilityScore,
      permissionResult,
      approvalResult: asset.approvalStatus,
      freshnessResult,
      verificationResult: "not_applicable",
      explanation: `Rejected because the asset supports ${asset.compatibleStacks.join(", ")} instead of the requested ${feature.requiredStack} stack.`,
      evidence: [asset.permissionNotes],
    };
  }

  if (freshnessResult === "stale") {
    return {
      id: `${feature.id}-${asset.id}`,
      featureId: feature.id,
      featureName: feature.name,
      asset,
      decision: "review_required",
      relevanceScore,
      compatibilityScore,
      permissionResult,
      approvalResult: asset.approvalStatus,
      freshnessResult,
      verificationResult: "needs_rerun",
      explanation: "Flagged for review because the verification evidence is older than 90 days.",
      evidence,
    };
  }

  if (relevanceScore >= 0.86 && permissionResult === "allowed") {
    return {
      id: `${feature.id}-${asset.id}`,
      featureId: feature.id,
      featureName: feature.name,
      asset,
      decision: "reuse",
      relevanceScore,
      compatibilityScore,
      permissionResult,
      approvalResult: asset.approvalStatus,
      freshnessResult,
      verificationResult: "passed",
      explanation: "Selected for reuse because relevance is high and approval, permission, compatibility, and verification checks passed.",
      evidence,
    };
  }

  if (relevanceScore >= 0.62) {
    return {
      id: `${feature.id}-${asset.id}`,
      featureId: feature.id,
      featureName: feature.name,
      asset,
      decision: "adapt",
      relevanceScore,
      compatibilityScore,
      permissionResult,
      approvalResult: asset.approvalStatus,
      freshnessResult,
      verificationResult: "passed",
      explanation: "Relevant but not a full match. Brownie would adapt the asset and generate project-specific glue code.",
      evidence,
    };
  }

  return {
    id: `${feature.id}-${asset.id}`,
    featureId: feature.id,
    featureName: feature.name,
    asset,
    decision: "rejected",
    relevanceScore,
    compatibilityScore,
    permissionResult,
    approvalResult: asset.approvalStatus,
    freshnessResult,
    verificationResult: "not_applicable",
    explanation: "Rejected because the mock relevance score is below the reuse threshold.",
    evidence,
  };
}

export function discoverDemoCandidates(request: BrownieDemoRequest = brownieDemoRequest): BrownieCandidate[] {
  return request.features.flatMap((feature) =>
    (feature.candidateAssetIds ?? scenarioCandidateIds[feature.id] ?? [])
      .map((assetId) => findAsset(assetId))
      .filter((asset): asset is BrownieAsset => Boolean(asset))
      .map((asset) => ({
        ...asset,
        featureId: feature.id,
        featureName: feature.name,
        relevanceScore: calculateMockSimilarity(feature, asset),
      })),
  );
}

export function evaluateDemoRequest(request: BrownieDemoRequest = brownieDemoRequest): BrownieDecision[] {
  const candidates = discoverDemoCandidates(request);
  return candidates.map((candidate) => {
    const feature = request.features.find((item) => item.id === candidate.featureId);
    if (!feature) {
      throw new Error(`Missing feature for candidate ${candidate.id}`);
    }
    return simulateAssetDecision(feature, candidate, request.requestingProjectId);
  });
}

export function buildDemoSnapshot(): BrownieDemoSnapshot {
  const candidates = discoverDemoCandidates();
  const decisions = evaluateDemoRequest();
  const reused = decisions.filter((decision) => decision.decision === "reuse");
  const adapted = decisions.filter((decision) => decision.decision === "adapt");
  const rejected = decisions.filter((decision) => decision.decision === "rejected");
  const review = decisions.filter((decision) => decision.decision === "review_required");
  const coveredFeatures = new Set([...reused, ...adapted].map((decision) => decision.featureId));
  const generatedFeatures = brownieDemoRequest.features.filter((feature) => !coveredFeatures.has(feature.id));

  return {
    request: brownieDemoRequest,
    candidates,
    decisions,
    verification: [
      {
        id: "verify-build",
        name: "TypeScript build",
        status: "passed",
        durationMs: 2100,
        detail: "Simulated build completed after composing reused assets with generated dashboard glue.",
      },
      {
        id: "verify-auth",
        name: "Auth and permission tests",
        status: "passed",
        durationMs: 1800,
        detail: "RoleGuard and AuthContext seeded evidence passed all auth-path checks.",
      },
      {
        id: "verify-dashboard-loading",
        name: "Dashboard loading state",
        status: "fixed",
        durationMs: 1400,
        detail: "Initial simulated assertion failed for loading skeleton; Brownie generated a small loading-state adapter.",
      },
      {
        id: "verify-notification-adapter",
        name: "Notification adapter tests",
        status: "passed",
        durationMs: 1600,
        detail: "NotificationService adapter passed template, retry, and audit-event checks.",
      },
    ],
    comparison: {
      brownieCostUsd: 0.12,
      generationOnlyCostUsd: 0.38,
      brownieTimeSeconds: 14,
      generationOnlyTimeSeconds: 28,
      reusedAssets: reused.length,
      adaptedAssets: adapted.length,
      generatedFeatures: generatedFeatures.length,
      rejectedCandidates: rejected.length,
      reviewCandidates: review.length,
      verificationPassRate: 98,
      note: "Simulated demo result based on seeded records and deterministic rules. Not a production benchmark.",
    },
    simulatedFiles: [
      { path: "src/auth/AuthContext.jsx", source: "reused", detail: "Reused from Acme Field Operations · Internal PM v2.3.1." },
      { path: "src/auth/RoleGuard.jsx", source: "reused", detail: "Reused from Acme Field Operations · Internal PM v2.1.0." },
      { path: "frontend/src/services/notificationService.js", source: "adapted", detail: "Adapted templates from Northstar Retail Labs · Commerce." },
      { path: "src/views/ProjectTrackerDashboard.tsx", source: "generated", detail: "Generated dashboard glue and loading-state adapter." },
      { path: "src/tests/projectTracker.demo.test.ts", source: "generated", detail: "Generated simulated verification coverage for the demo scenario." },
    ],
    auditEvents: [
      { id: "audit-1", timestamp: "2026-10-22T18:15:01Z", actor: "Brownie Demo", action: "Request parsed", detail: "Extracted auth, permissions, notifications, and dashboard features." },
      { id: "audit-2", timestamp: "2026-10-22T18:15:03Z", actor: "Brownie Demo", action: "Catalog searched", detail: "Evaluated candidates across three fictional projects." },
      { id: "audit-3", timestamp: "2026-10-22T18:15:05Z", actor: "Policy simulator", action: "Permission gate applied", detail: "Blocked private support workflow assets from reuse." },
      { id: "audit-4", timestamp: "2026-10-22T18:15:07Z", actor: "Verification simulator", action: "Evidence checked", detail: "Accepted fresh approved evidence and flagged deprecated or stale records." },
    ],
  };
}
