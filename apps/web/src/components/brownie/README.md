# Brownie Demo

This folder contains a stakeholder-ready Brownie demo inside the existing Terrarium web UI.

It is intentionally mock-only. It does not build production Brownie infrastructure, run embeddings, create a vector database, call external AI APIs, connect to Confluence or Teams, or reuse real customer code.

## What Is Real

- The Terrarium navigation entry and Brownie UI are real React and MUI components.
- The catalog, decision rules, workflow state, reset behavior, provenance panels, verification panels, audit view, and comparison view are interactive.
- The decision engine is deterministic TypeScript logic in `mockData.ts`.
- The seeded data is separated from UI components so a future service can replace it.

## What Is Simulated

- The three projects are fictional demo organizations.
- Asset approval status, permissions, test evidence, version history, and usage counts are seeded records.
- Knowledge sources are local records inspired by Confluence pages, Teams discussions, ADRs, API docs, and testing notes.
- Relevance scores use deterministic keyword and stack matching, not embeddings.
- Verification results and comparison metrics are illustrative demo results, not production measurements.

Every metric-oriented view labels the result as simulated demo data.

## Running The Demo

Brownie runs inside the normal Terrarium chat build; there is no separate app or rail entry.

1. Sign in and type a build prompt in the chat, for example "Build an SAP purchase requisition approval app".
2. The worker plans the architecture first (`architecture.planned`) and saves the plan, then asks the intent questions (`intent.classified`, phase `clarify`).
3. After the answers, the intent is `ready`. The worker saves the intent, emits `brownie.review`, and pauses; no code is generated yet.
4. A `Brownie reuse` card appears (`BrownieChatStep`). It calls `POST /brownie/catalog/sync`, which publishes three fictional source projects to the signed-in user's dashboard (idempotent; a new version only when files change) and returns the catalog. Each offer shows the dashboard app, its version, and the source file it comes from. Only assets the server marks reusable are offered; RoleGuard always brings AuthContext with it.
5. `Reuse N · generate M` or `Generate everything` posts `brownieAssetIds` with the same session. The worker loads the latest stored version of each dashboard project from Postgres (`apps/api/terrarium_api/brownie_catalog.py`), resolves the ids (`brownie_reuse.py`), and emits `brownie.applied` with a provenance map: asset, dashboard tool id and version, source path, target path, and sha256.
6. The exact stored files are copied to `src/reused/<project>/` (or `frontend/src/reused/<project>/` for full-stack builds), keeping their relative layout so their own imports still resolve. Codegen gets a provided-versus-generate map with the exact import line for each export, must not output those paths, and is rejected if it imports a name the reused file does not export.

The source projects live in `packages/agents/terrarium_agents/brownie_projects.py` and are complete runnable apps (Acme Internal PM in React, Northstar Commerce in React + Express, Helio Support Desk in Angular). They open from the dashboard like any other tool and carry a "Brownie source · fictional" chip.

Reuse is wired for React builds (frontend-only or full stack). Angular and SAPUI5 builds still show the review, but every file is generated.

The server question defaults to full stack (React or Angular + Node/Express) when it is not answered. If the answers change the stack after the first-turn plan, the worker re-plans once before the review.

There is no template fallback in live mode. If no coding model returns files, the build stops with `sandbox.unhealthy` naming each provider's failure (for example "AWS keys rejected" or "quota exhausted") and does not run the heal loop. Stub mode (`TERRARIUM_AGENTS=stub`) still uses the deterministic files for tests.

`apps/api/scripts/brownie_e2e.py` drives one build end to end inside the worker container with live models.

The scenario is matched from the prompt text (`matchScenarioForPrompt`): SAP + inventory/stock picks the inventory console, SAP or procurement terms pick purchase requisition, shop/cart/order terms pick commerce, and anything else uses the general business-app catalog.

## Main Scenario

The chat card is `BrownieChatStep.tsx`; scenarios and matching live in `demoScenarios.ts`, and the fictional catalog and decision engine in `mockData.ts`. The prompt is matched to one of three build projects:

- Commerce Operations Portal
- SAP Purchase Requisition Workspace
- SAP Inventory Reconciliation Console

Prompts that match none of them use the general business app (login, permissions, notifications, dashboard). Every scenario lists its own capabilities and candidate assets, and the decisions come from `simulateAssetDecision`, not hand-written results:

| Scenario | Offered for reuse | Left to codegen |
| --- | --- | --- |
| Commerce | AuthContext, RoleGuard, ProductCard, NotificationService | Cart, checkout, and orders |
| SAP requisition | AuthContext, RoleGuard, ProjectDashboardShell, NotificationService | Requisition form, approval workflow, vendor lookup |
| SAP inventory | AuthContext, RoleGuard, ProjectDashboardShell, NotificationService | Stock count entry, reconciliation workflow |

Held back by the gates: `TicketWorkflow` and `AgentAssignmentRules` (private to another organization), `NotificationBannerLegacy` (deprecated), `PaymentAPI` and `TicketCard` (not approved), `SupportDashboardAngular` and `WebhookVerifier` (incompatible stack), and `ProductCard` when it is offered for a requisition form or stock count (relevance too low).

## Production Transition Notes

Replacing this mock layer with production Brownie would require:

- A real catalog persistence layer.
- An ingestion process from published Terrarium tools or approved repositories.
- Permission-aware service APIs, not just seeded visibility flags.
- Real approval workflows and audit storage.
- Actual retrieval, compatibility analysis, integration, and sandbox verification.
- Real metrics from measured runs rather than illustrative estimates.

Until those systems exist, this demo should be presented as a realistic product experience, not as production code reuse.
