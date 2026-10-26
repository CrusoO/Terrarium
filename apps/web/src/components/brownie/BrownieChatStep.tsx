import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { Box, Button, ButtonBase, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { syncBrownieCatalog, type BrownieCatalog, type BrownieCatalogAsset } from "../../api/brownie";
import type { ChatItem } from "../../types/chat";
import { chosenDecision, matchScenarioForPrompt } from "./demoScenarios";
import { findAsset, type BrownieDecision, type BrownieFeature } from "./mockData";

const ACCENT = "#6e1429";
const STAGE_DELAY_MS = 600;
const MONO = { fontFamily: "ui-monospace, monospace", fontSize: "0.7rem" } as const;
const completedRuns = new Set<string>();

type BrownieItem = Extract<ChatItem, { kind: "brownie" }>;

type BrownieChatStepProps = {
  item: BrownieItem;
  onConfirm?: (assetIds: string[]) => void;
};

type WorkRow = {
  id: string;
  name: string;
  does: string;
  asset?: BrownieCatalogAsset;
  closest?: string;
};

function closestDecision(decisions: BrownieDecision[], featureId: string): BrownieDecision | undefined {
  return decisions
    .filter((decision) => decision.featureId === featureId && decision.asset)
    .sort((left, right) => right.relevanceScore - left.relevanceScore)[0];
}

function whyNotCopied(decision: BrownieDecision | undefined, differentScreen: boolean): string | undefined {
  const asset = decision?.asset;
  if (!asset) return undefined;
  if (decision.permissionResult === "blocked") {
    return `${asset.name} does a similar job, but it belongs to a private app, so it cannot be copied.`;
  }
  if (decision.approvalResult === "deprecated") {
    return `${asset.name} is an older version that is no longer used.`;
  }
  if (decision.approvalResult === "pending_review" || decision.approvalResult === "unapproved") {
    return `${asset.name} is still a draft, so it needs a review before it can be reused.`;
  }
  if (differentScreen || decision.compatibilityScore < 0.5) {
    return `${asset.name} does a similar job, but it is a different kind of screen, so it cannot be copied into this app.`;
  }
  if (decision.freshnessResult === "stale") {
    return `${asset.name} has old checks, so it should be created again instead of copied.`;
  }
  return `${asset.name} is not close enough, so this should be created new.`;
}

function workRows(
  features: BrownieFeature[],
  decisions: BrownieDecision[],
  byId: Map<string, BrownieCatalogAsset>,
  reuseSupported: boolean,
): { reuse: WorkRow[]; create: WorkRow[] } {
  const reuse: WorkRow[] = [];
  const create: WorkRow[] = [];
  for (const feature of features) {
    const chosen = chosenDecision(decisions, feature.id);
    const source = chosen?.asset ? byId.get(chosen.asset.id) : undefined;
    const row: WorkRow = { id: feature.id, name: feature.name, does: feature.description };
    if (reuseSupported && source?.reusable) {
      reuse.push({ ...row, asset: source });
    } else {
      const closest = chosen?.asset && !reuseSupported ? chosen : closestDecision(decisions, feature.id);
      create.push({ ...row, closest: whyNotCopied(closest, !reuseSupported) });
    }
  }
  return { reuse, create };
}

function toggled(current: Set<string>, id: string, byId: Map<string, BrownieCatalogAsset>): Set<string> {
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
    for (const other of next) if (byId.get(other)?.dependsOn.includes(id)) next.delete(other);
  } else {
    next.add(id);
    for (const dep of byId.get(id)?.dependsOn ?? []) next.add(dep);
  }
  return next;
}

export function BrownieChatStep({ item, onConfirm }: BrownieChatStepProps) {
  const { id, prompt, reuseSupported, status, recommendation } = item;
  const { snapshot, brainStages, name } = useMemo(() => matchScenarioForPrompt(prompt), [prompt]);
  const [stage, setStage] = useState(completedRuns.has(id) || status !== "review" ? brainStages.length : 0);
  const [catalog, setCatalog] = useState<BrownieCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const reviewing = status === "review";

  useEffect(() => {
    if (!reviewing) return;
    let live = true;
    syncBrownieCatalog()
      .then((value) => live && setCatalog(value))
      .catch((error: unknown) => live && setCatalogError(error instanceof Error ? error.message : String(error)));
    return () => {
      live = false;
    };
  }, [reviewing]);

  const catalogPending = reviewing && reuseSupported && !catalog && !catalogError;
  const checking = stage < brainStages.length || catalogPending;
  const byId = useMemo(() => new Map((catalog?.assets ?? []).map((asset) => [asset.id, asset])), [catalog]);
  const { reuse, create } = useMemo(
    () => workRows(snapshot.request.features, snapshot.decisions, byId, reuseSupported),
    [byId, reuseSupported, snapshot],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => {
    setSelected(new Set(reuse.map((row) => row.asset?.id).filter((assetId): assetId is string => Boolean(assetId))));
  }, [reuse]);

  useEffect(() => {
    if (stage >= brainStages.length) {
      if (!catalogPending) completedRuns.add(id);
      return;
    }
    const timer = window.setTimeout(() => setStage((current) => current + 1), STAGE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [brainStages.length, catalogPending, id, stage]);

  const chosen = reuse.filter((row) => row.asset && selected.has(row.asset.id));
  const best = chosen.length
    ? `reuse ${chosen.map((row) => row.name).join(", ")}${create.length ? `, and create ${create.map((row) => row.name).join(", ")}` : ""}`
    : "create every part new. I checked the existing project repos, and none of those parts can be copied into this app.";

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Box sx={{ width: 22, height: 22, borderRadius: "7px", bgcolor: ACCENT, color: "#fff", display: "grid", placeItems: "center" }}>
          <AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 650 }}>
          Brownie reuse
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ px: 0.75, py: 0.1, borderRadius: 1, bgcolor: "rgba(237, 108, 2, 0.1)", color: "warning.dark", fontWeight: 600 }}>
          example apps
        </Typography>
      </Stack>

      {checking ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.25 }}>
          <span className="agent-step-pulse" />
          <Typography variant="caption" color="text.secondary">
            {stage < brainStages.length ? brainStages[stage].title : "Checking the existing project repos"}…
          </Typography>
        </Stack>
      ) : status === "applied" ? (
        <Applied item={item} />
      ) : status === "superseded" ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Replaced by a newer review.
        </Typography>
      ) : (
        <Box className="agent-trace">
          <Typography variant="caption" sx={{ display: "block", mt: 1, lineHeight: 1.5 }}>
            <Box component="span" sx={{ fontWeight: 700 }}>Best option: </Box>
            {best}
          </Typography>
          {catalogError ? (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
              I could not read the existing project repos, so every part will be created new.
            </Typography>
          ) : null}
          {recommendation?.checkedProjects.length ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35, lineHeight: 1.5 }}>
              Project repos checked: {recommendation.checkedProjects.map((project) => project.name).join(", ")}
            </Typography>
          ) : null}

          {reuse.length ? (
            <Stack spacing={0.5} sx={{ mt: 1.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Reuse</Typography>
              {reuse.map((row) => {
                const asset = row.asset;
                if (!asset) return null;
                const on = selected.has(asset.id);
                return (
                  <ButtonBase
                    key={row.id}
                    disabled={!reviewing}
                    onClick={() => setSelected((current) => toggled(current, asset.id, byId))}
                    aria-pressed={on}
                    sx={{
                      justifyContent: "flex-start",
                      gap: 1,
                      px: 1,
                      py: 0.75,
                      borderRadius: "10px",
                      border: 1,
                      borderColor: on ? "rgba(110, 20, 41, 0.35)" : "divider",
                      bgcolor: on ? "rgba(110, 20, 41, 0.04)" : "transparent",
                      textAlign: "left",
                    }}
                  >
                    <Box sx={{ width: 16, height: 16, flexShrink: 0, borderRadius: "5px", border: 1.5, borderColor: on ? ACCENT : "text.disabled", bgcolor: on ? ACCENT : "transparent", color: "#fff", display: "grid", placeItems: "center" }}>
                      {on ? <CheckRoundedIcon sx={{ fontSize: 12 }} /> : null}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" component="div" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                      <Typography variant="caption" component="div" color="text.secondary">{row.does}</Typography>
                      <Typography variant="caption" component="div" color="text.secondary">Copy {asset.name} from {asset.toolName}</Typography>
                    </Box>
                  </ButtonBase>
                );
              })}
            </Stack>
          ) : null}

          {create.length ? (
            <Stack spacing={0.75} sx={{ mt: 1.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Create new</Typography>
              {create.map((row) => (
                <Box key={row.id}>
                  <Typography variant="caption" component="div" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                  <Typography variant="caption" component="div" color="text.secondary">{row.does}</Typography>
                  {row.closest ? (
                    <Typography variant="caption" component="div" color="text.secondary">{row.closest}</Typography>
                  ) : null}
                </Box>
              ))}
            </Stack>
          ) : null}

          <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: "center" }}>
            <Button
              size="small"
              variant="contained"
              disableElevation
              disabled={!reviewing || !onConfirm}
              onClick={() => onConfirm?.(chosen.flatMap((row) => (row.asset ? [row.asset.id] : [])))}
              sx={{ textTransform: "none", borderRadius: "9px", bgcolor: ACCENT, "&:hover": { bgcolor: "#5a1022" } }}
            >
              {chosen.length ? `Reuse ${chosen.length} and create ${create.length + reuse.length - chosen.length}` : "Create these parts"}
            </Button>
            {chosen.length ? (
              <Button size="small" disabled={!reviewing || !onConfirm} onClick={() => onConfirm?.([])} sx={{ textTransform: "none", color: "text.secondary" }}>
                Create everything new
              </Button>
            ) : null}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

function Applied({ item }: { item: BrownieItem }) {
  const provenance = item.provenance ?? [];
  const ignored = item.ignored ?? [];
  const sources = [...new Set(provenance.map((entry) => `${entry.toolName} v${entry.toolVersion}`))];
  return (
    <Box className="agent-trace" sx={{ mt: 1 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <CheckRoundedIcon sx={{ fontSize: 15, color: "success.main" }} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {provenance.length
            ? `Reused ${provenance.length} component${provenance.length === 1 ? "" : "s"} from ${sources.join(" and ")}`
            : "Nothing reused · codegen writes every file"}
        </Typography>
      </Stack>
      {provenance.length ? (
        <Stack spacing={0.75} sx={{ mt: 0.75, pl: 2.75 }}>
          {provenance.map((entry) => (
            <Box key={entry.assetId}>
              <Typography variant="caption" component="div" sx={{ fontWeight: 600 }}>
                {entry.name} v{entry.version}
                <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
                  {" "}
                  · {entry.toolName} v{entry.toolVersion}
                </Box>
              </Typography>
              {entry.files.map((file) => (
                <Typography key={file.target} variant="caption" component="div" color="text.secondary" sx={MONO} title={`sha256 ${file.sha256}`}>
                  {file.source} → {file.target}
                </Typography>
              ))}
            </Box>
          ))}
        </Stack>
      ) : null}
      {ignored.length ? (
        <Stack spacing={0.25} sx={{ mt: 0.75, pl: 2.75 }}>
          {ignored.map((entry) => (
            <Typography key={entry.assetId} variant="caption" color="text.secondary">
              Skipped {findAsset(entry.assetId)?.name ?? entry.assetId} — {entry.reason}
            </Typography>
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
