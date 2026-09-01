# P2-S5: Layout recipes and theme tokens

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 2 — Core Agents
- **Packages:** packages/templates, packages/agents, apps/api
- **Depends on:** P2-S2
- **Parallel with:** P2-S3

## Goal

First-time prompts can ask for anything. Do not store a kit per product and do not scrape the web. Keep one vanilla shell plus four empty layouts in git; Code Generator picks a layout, applies CSS theme tokens, and overlays the FileMap. Published tools become the library in P5.

## Contract changes

- None. LayoutKind stays internal to Code Generator (same as SessionPlan). Do not add a template marketplace DTO.

## Acceptance criteria

- packages/templates has a shell with CSS variables (--bg, --ink, --accent, --radius) and four runnable layouts: board, form, list, split (vanilla HTML/CSS/JS, no CDN)
- Code Generator maps a first-time prompt to one of those four layouts, not to a product page (no calculator.html / tic-tac-toe.html in git)
- Product skeletons under packages/templates/skeletons are unused or removed
- Overlay honors the shell tokens; a dark/light/maroon choice in the spec is not ignored
- A prompt for an unseen tool still returns a FileMap and boots the sandbox
- kind=modify is still rejected
- No scrape, npm, or external HTML packs

## Non-goals

- No Smart Match or published-tool remix (P5)
- No user-facing template gallery UI
- No Editor (P2-S3)
- No npm/React in the sandbox

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.

- A kit is a FileMap folder we already own (index.html, styles.css, app.js), not a screenshot and not a scraped site.
- First-time user: pick layout by UI shape (board / form+result / list+detail / split page), then overlay the product into those slots.
- Second time the org has published a similar tool: P5 clones that FileMap and skips Code Generator.
