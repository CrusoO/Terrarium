import { Box, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";

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
        p: 3,
        background:
          "linear-gradient(45deg,#f6f3f2 25%,transparent 25%,transparent 75%,#f6f3f2 75%), linear-gradient(45deg,#f6f3f2 25%,transparent 25%,transparent 75%,#f6f3f2 75%)",
        backgroundSize: "24px 24px",
        backgroundPosition: "0 0, 12px 12px",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 380,
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "background.paper",
          boxShadow: "0 12px 40px rgba(76,13,28,0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#e8b4bc" }} />
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#e8b4bc" }} />
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#e8b4bc" }} />
          <Box
            sx={{
              ml: 1,
              flex: 1,
              height: 18,
              borderRadius: 99,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
            }}
          />
        </Box>
        {active ? <LinearProgress /> : <Box sx={{ height: 4, bgcolor: "divider" }} />}
        <Stack sx={{ alignItems: "center", px: 3, py: 3, textAlign: "center" }}>
          {active ? (
            <CircularProgress size={28} thickness={4} sx={{ mb: 1.5, color: "primary.main" }} />
          ) : null}
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {copy.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.5 }}>
            {copy.detail}
          </Typography>
          <SkeletonBars />
        </Stack>
      </Box>
    </Box>
  );
}

export function PreviewPanel({
  previewUrl,
  status,
}: {
  previewUrl: string | null;
  status: PreviewStatus;
}) {
  const live = status === "live" && Boolean(previewUrl);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
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
        <Typography variant="caption" color="text.secondary">
          {status === "live" ? "Live preview" : status === "ready" ? "Spec ready" : status === "idle" ? "Waiting" : "Not building yet"}
        </Typography>
      </Box>
      {live ? (
        <>
          <Typography
            variant="caption"
            sx={{ px: 2, py: 0.75, borderBottom: 1, borderColor: "divider", fontFamily: "monospace", wordBreak: "break-all" }}
            color="text.secondary"
          >
            {previewUrl}
          </Typography>
          <Box
            component="iframe"
            title="Generated tool preview"
            src={previewUrl ?? undefined}
            sandbox="allow-scripts allow-same-origin allow-forms"
            sx={{ flex: 1, minHeight: 0, border: 0, bgcolor: "background.paper" }}
          />
        </>
      ) : (
        <PreviewPlaceholder status={status === "live" ? "idle" : status} />
      )}
    </Box>
  );
}
