import KeyboardTabRoundedIcon from "@mui/icons-material/KeyboardTabRounded";
import { Box, CircularProgress, IconButton, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import type { SessionEvent } from "@terrarium/contracts";
import { useSplitControls } from "../layout/SplitControls";
import { EventLogButton } from "./EventLogButton";

export type PreviewStatus = "idle" | "intent" | "clarify" | "ready" | "live";

const COPY: Record<Exclude<PreviewStatus, "live">, { title: string; detail: string }> = {
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

function PreviewPlaceholder({ status }: { status: Exclude<PreviewStatus, "live"> }) {
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

export function PreviewPanel({
  events,
  previewUrl,
  status,
}: {
  events: SessionEvent[];
  previewUrl: string | null;
  status: PreviewStatus;
}) {
  const split = useSplitControls();
  const live = status === "live" && Boolean(previewUrl);

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
          <EventLogButton events={events} />
          <Typography variant="caption" color="text.secondary">
            {status === "live" ? "Live preview" : status === "ready" ? "Spec ready" : status === "idle" ? "Waiting" : "Not building yet"}
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
      {live ? (
        <Box
          component="iframe"
          title="Generated tool preview"
          src={previewUrl ?? undefined}
          sandbox="allow-scripts allow-same-origin allow-forms"
          sx={{ flex: 1, minHeight: 0, border: 0, bgcolor: "background.paper" }}
        />
      ) : (
        <PreviewPlaceholder status={status === "live" ? "idle" : status} />
      )}
    </Box>
  );
}
