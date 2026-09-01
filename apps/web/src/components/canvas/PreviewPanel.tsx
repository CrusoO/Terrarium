import KeyboardTabRoundedIcon from "@mui/icons-material/KeyboardTabRounded";
import { Box, Chip, CircularProgress, IconButton, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import type { FileMap, SessionEvent } from "@terrarium/contracts";
import { useSplitControls } from "../layout/SplitControls";
import { CodePanel } from "./CodePanel";
import { EventLogButton } from "./EventLogButton";

export type PreviewStatus = "idle" | "intent" | "clarify" | "ready" | "live" | "draft" | "updating";

const STATUS_LABEL: Record<PreviewStatus, string> = {
  idle: "Waiting",
  intent: "Not building yet",
  clarify: "Not building yet",
  ready: "Spec ready",
  draft: "Draft preview",
  updating: "Writing files",
  live: "Live preview",
};

const COPY: Record<Exclude<PreviewStatus, "live" | "draft" | "updating">, { title: string; detail: string }> = {
  idle: {
    title: "Preview waits for a spec",
    detail: "Describe a tool in chat. I’ll ask a few questions first — the sandbox stays empty until then.",
  },
  intent: {
    title: "Reading your request",
    detail: "Intent Agent is classifying what you want. Nothing is generated yet.",
  },
  clarify: {
    title: "Gathering a few details",
    detail: "Answer the questions in chat. The live preview starts after the spec is ready.",
  },
  ready: {
    title: "Spec is ready",
    detail: "Intent is classified. Preview stays empty until Code Generator writes files.",
  },
};

function SkeletonBars() {
  return (
    <Stack spacing={1.25} sx={{ width: "100%", maxWidth: 280, mt: 2 }}>
      <Box className="preview-skel-bar" sx={{ height: 10, width: "72%" }} />
      <Box className="preview-skel-bar" sx={{ height: 10, width: "100%" }} />
      <Box className="preview-skel-bar" sx={{ height: 10, width: "88%" }} />
      <Box className="preview-skel-bar" sx={{ height: 72, width: "100%", mt: 0.5 }} />
    </Stack>
  );
}

function PreviewPlaceholder({ status }: { status: Exclude<PreviewStatus, "live" | "draft" | "updating"> }) {
  const copy = COPY[status];
  const active = status === "intent" || status === "clarify";

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        alignItems: "center",
        justifyContent: "center",
        px: 4,
        bgcolor: "background.default",
      }}
    >
      <Stack sx={{ alignItems: "center", maxWidth: 420, textAlign: "center" }}>
        {active ? <LinearProgress sx={{ width: 160, mb: 2, borderRadius: 99 }} /> : null}
        {active ? (
          <CircularProgress size={26} thickness={4} sx={{ mb: 1.5, color: "primary.main" }} />
        ) : null}
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
          {copy.detail}
        </Typography>
        <SkeletonBars />
      </Stack>
    </Box>
  );
}

export function iframeSrc(previewUrl: string): string {
  if (previewUrl.startsWith("/")) {
    return previewUrl.endsWith("/") ? previewUrl : `${previewUrl}/`;
  }
  try {
    const parsed = new URL(previewUrl);
    const host = parsed.hostname;
    if (host.includes("nip.io") || host.endsWith(".sandbox.local") || host.endsWith(".localhost")) {
      const slug = host.split(".")[0];
      if (slug) return `/preview/${slug}/`;
    }
  } catch {
    return previewUrl;
  }
  return previewUrl;
}

export function PreviewPanel({
  events,
  previewUrl,
  status,
  files = null,
  tab = "preview",
  onTabChange,
}: {
  events: SessionEvent[];
  previewUrl: string | null;
  status: PreviewStatus;
  files?: FileMap | null;
  tab?: "preview" | "code";
  onTabChange?: (tab: "preview" | "code") => void;
}) {
  const split = useSplitControls();
  const src = previewUrl ? iframeSrc(previewUrl) : null;
  const showFrame = Boolean(src) && (status === "live" || status === "draft" || status === "updating");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "primary.main" }}
        >
          Generated tool
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip
            label="Preview"
            size="small"
            variant={tab === "preview" ? "filled" : "outlined"}
            color={tab === "preview" ? "primary" : "default"}
            onClick={() => onTabChange?.("preview")}
          />
          <Chip
            label="Code"
            size="small"
            variant={tab === "code" ? "filled" : "outlined"}
            color={tab === "code" ? "primary" : "default"}
            onClick={() => onTabChange?.("code")}
          />
          <EventLogButton events={events} />
          <Typography variant="caption" color="text.secondary">
            {STATUS_LABEL[status]}
          </Typography>
          {split ? (
            <Tooltip title="Hide chat">
              <IconButton size="small" aria-label="Hide chat" onClick={split.collapseChat}>
                <KeyboardTabRoundedIcon sx={{ fontSize: 18, transform: "scaleX(-1)" }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Box>
      {showFrame ? (
        <Box
          component="iframe"
          title="Generated tool preview"
          src={src ?? undefined}
          sandbox="allow-scripts allow-same-origin allow-forms"
          sx={{
            display: tab === "preview" ? "block" : "none",
            flex: 1,
            minHeight: 0,
            border: 0,
            bgcolor: "background.paper",
          }}
        />
      ) : null}
      {tab === "code" ? <CodePanel files={files} /> : showFrame ? null : (
        <PreviewPlaceholder status={status === "live" || status === "draft" || status === "updating" ? "idle" : status} />
      )}
    </Box>
  );
}
