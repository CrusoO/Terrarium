# Terrarium — agent instructions

Read [PLAN.md](PLAN.md) before writing code. Architecture in PLAN.md is frozen. Do not reopen the stack, pipeline, or package boundaries in a story.

## Starting a story

1. User names a story ID (`P1-S1` … `P6-S4`) or a phase.
2. Read `docs/stories/<id>-*.md` and the Contract changes section.
3. If contracts change, edit `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first.
4. Touch only the packages listed on the story.
5. When acceptance criteria pass, check the box in PLAN.md.

If the user does not name a story, ask for a story ID. Do not invent work from another phase.

## Source of truth

- Architecture: `PLAN.md`
- Story fields: `docs/stories.catalog.json`
- Generated stories: `docs/stories/` (do not hand-edit; run `node scripts/generate-stories.mjs`)

## Non-negotiables

- Agents return a `FileMap`. Only `packages/sandbox` talks to Docker.
- Preview is an iframe URL, never inlined HTML in the parent. Monaco is not the live canvas.
- Self-heal max 3, then `heal.exhausted`.
- Smart Match runs before Code Generator and never auto-accepts.
- Until P6-S1, actor is `dev-user` from contracts.
- `apps/api` and agents are FastAPI/Python. `apps/web` is React.
