# Phase 7 demo script

Prerequisites: `pnpm install`, `uv sync`, Docker Desktop, `pnpm dev:api`, `pnpm dev:worker`, `pnpm dev:web`. Set `TERRARIUM_TRUST_OFFLINE=1` for scanner/check tests without extra containers.

## 1. Healthy build

1. Create a simple React tool from chat and wait for preview.
2. Observe acceptance checks completing in chat (`check.step` events when wired to SSE).
3. Confirm **Healthy** badge left of **Publish** in the preview toolbar.
4. Open **Publish** → pre-publish dialog runs `POST /sessions/{id}/publish-check` (step progress via SSE `check.step`) → publish succeeds when healthy or warnings acknowledged.

## 2. Unsafe dependency

1. Seed `package.json` with `"lodash": "4.17.20"` (known advisory fixture).
2. Re-run publish check → badge **Unsafe**; panel shows blocked publish.
3. `POST /tools/{id}/publish` returns **409** with `blockingReasons`.

## 3. Fix automatically

1. Click **Fix automatically** in the pre-publish panel.
2. Ladder runs `patch_upgrade` to `4.17.21`.
3. Re-check → **Healthy** → publish through the server gate.

## 4. WhatsApp queue

1. Stop the API worker (`dev:worker`).
2. Send a change request to the relay webhook (see `apps/relay/README.md`).
3. Reply: “Queued — your workstation is offline…”
4. Start worker → claim → propose tests → reply **YES** → build → gate → **PUBLISH** (or **UNDO**). Viewer-linked numbers never build; unsafe drafts never publish.

## 5. Security rail

1. Open **Security** in the icon rail.
2. **Generate code** under WhatsApp (requires signed-in API session).
3. Workspace tools show live **HealthBadge** per tool.

## 6. Morning digest

1. Run nightly scan job (or wait for schedule).
2. Owner receives digest on linked WhatsApp with patched tools and `APPROVE 1` items.
