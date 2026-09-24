import { useEffect, useMemo, useRef, useState } from "react";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import KeyboardTabRoundedIcon from "@mui/icons-material/KeyboardTabRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { Box, IconButton, LinearProgress, Paper, Stack, Tooltip, Typography } from "@mui/material";
import type { FileMap, RuntimeErrorRequest, SessionEvent } from "@terrarium/contracts";
import { useSplitControls } from "../layout/SplitControls";
import { CodePanel } from "./CodePanel";
import { EventLogButton } from "./EventLogButton";
import { publishSession } from "../../api/sessions";
import { applyPreviewDocument } from "../../utils/domMorpher";
import { fileMapToPreviewDocument } from "../../utils/previewDocument";

export type PreviewStatus = "idle" | "intent" | "clarify" | "ready" | "live" | "draft" | "updating";

const STATUS_CONFIG: Record<PreviewStatus, { label: string; color: string }> = {
  idle: { label: "No preview", color: "#1f8a4c" },
  intent: { label: "Processing...", color: "primary.main" },
  clarify: { label: "Waiting for input", color: "warning.main" },
  ready: { label: "Ready to build", color: "success.main" },
  draft: { label: "Draft", color: "warning.main" },
  updating: { label: "Updating...", color: "primary.main" },
  live: { label: "Live", color: "success.main" },
};

const COPY: Record<Exclude<PreviewStatus, "live" | "draft" | "updating">, { title: string; detail: string; icon: string }> = {
  idle: {
    title: "Nothing built yet",
    detail: "Tell the assistant what you'd like to make. It'll ask a few questions, then a live preview appears right here.",
    icon: "👋",
  },
  intent: {
    title: "Understanding your request",
    detail: "Reading your description and planning the app structure. This won't take long.",
    icon: "🤔",
  },
  clarify: {
    title: "Need a few more details",
    detail: "Answer the questions in chat to help me understand exactly what you want. The preview will appear once we're ready.",
    icon: "💭",
  },
  ready: {
    title: "Specifications ready",
    detail: "I know what to build! The code generator will start creating your app momentarily.",
    icon: "✨",
  },
};

function SkeletonBars() {
  return (
    <Stack spacing={1.25} sx={{ width: "100%", mt: 3, alignItems: "stretch" }}>
      <Box className="preview-skel-bar" sx={{ height: 10, width: "72%", mx: "auto" }} />
      <Box className="preview-skel-bar" sx={{ height: 10, width: "100%" }} />
      <Box className="preview-skel-bar" sx={{ height: 10, width: "88%", mx: "auto" }} />
      <Box className="preview-skel-bar" sx={{ height: 72, width: "100%", mt: 0.5, borderRadius: "12px" }} />
    </Stack>
  );
}

function PreviewPlaceholder({
  status,
}: {
  status: Exclude<PreviewStatus, "live" | "draft" | "updating">;
}) {
  const copy = COPY[status];
  const idle = status === "idle";

  return (
    <Box
      className="preview-stage"
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        alignItems: "center",
        justifyContent: "center",
        px: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 420,
          maxWidth: "100%",
          px: 4,
          py: 4.25,
          borderRadius: "18px",
          border: "1px solid #efeae4",
          boxShadow: "0 12px 32px rgba(70, 54, 40, 0.05)",
          textAlign: "center",
        }}
      >
        {idle ? (
          <Box
            sx={{
              width: 42,
              height: 42,
              mx: "auto",
              mb: 1.75,
              borderRadius: "12px",
              bgcolor: "#f6e8ec",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DesktopWindowsOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
        ) : null}
        <Typography sx={{ fontWeight: 700, fontSize: "1.02rem", mb: 1 }}>
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 340, mx: "auto" }}>
          {copy.detail}
        </Typography>
        {idle ? null : <SkeletonBars />}
      </Paper>
    </Box>
  );
}

/**
 * Normalise a sandbox previewUrl for the iframe src.
 * Keep http://127.0.0.1:{port}/ as-is so the child is a different origin
 * from the parent on :5173 (separate localStorage / cookies).
 */
export function iframeSrc(previewUrl: string): string {
  if (previewUrl.startsWith("/")) {
    return previewUrl.endsWith("/") ? previewUrl : `${previewUrl}/`;
  }
  try {
    const parsed = new URL(previewUrl);
    const host = parsed.hostname;
    if (host === "127.0.0.1" || host === "localhost") {
      return previewUrl.endsWith("/") ? previewUrl : `${previewUrl}/`;
    }
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
  streamFiles = null,
  sessionId = null,
  tab = "preview",
  onTabChange,
  onRuntimeError,
  refreshKey = 0,
}: {
  events: SessionEvent[];
  previewUrl: string | null;
  status: PreviewStatus;
  files?: FileMap | null;
  streamFiles?: FileMap | null;
  sessionId?: string | null;
  tab?: "preview" | "code";
  onTabChange?: (tab: "preview" | "code") => void;
  onRuntimeError?: (error: RuntimeErrorRequest) => void;
  refreshKey?: number;
}) {
  const split = useSplitControls();
  const [publishing, setPublishing] = useState(false);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const src = previewUrl ? iframeSrc(previewUrl) : null;
  const streamDocument = useMemo(() => fileMapToPreviewDocument(streamFiles), [streamFiles]);
  const showFrame = Boolean(src || streamDocument) && (status === "live" || status === "draft" || status === "updating");
  const canPublish = Boolean(sessionId) && status === "live" && !publishing;
  const statusConfig = STATUS_CONFIG[status];

  useEffect(() => {
    if (!streamDocument || !iframeRef.current || tab !== "preview" || !showFrame) {
      return;
    }
    applyPreviewDocument(iframeRef.current, streamDocument);
  }, [showFrame, streamDocument, tab]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as Partial<RuntimeErrorRequest> & { type?: string };
      if (data?.type !== "terrarium-preview-error" || !sessionId) {
        return;
      }
      onRuntimeError?.({
        source: "frontend",
        message: typeof data.message === "string" ? data.message : "Preview runtime error",
        stack: typeof data.stack === "string" ? data.stack : undefined,
        filename: typeof data.filename === "string" ? data.filename : undefined,
        lineno: typeof data.lineno === "number" ? data.lineno : undefined,
        colno: typeof data.colno === "number" ? data.colno : undefined,
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onRuntimeError, sessionId]);

  function handleFrameLoad() {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow || streamDocument) {
      return;
    }
    try {
      frameWindow.addEventListener("error", (event) => {
        onRuntimeError?.({
          source: "frontend",
          message: event.message || "Preview runtime error",
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });
      frameWindow.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason as Error | string | undefined;
        onRuntimeError?.({
          source: "frontend",
          message: reason instanceof Error ? reason.message : String(reason || "Unhandled promise rejection"),
          stack: reason instanceof Error ? reason.stack : undefined,
        });
      });
    } catch {
      // Cross-origin port previews cannot attach listeners on the child window.
    }
  }

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
      {/* Enhanced header */}
      <Stack
        direction="row"
        sx={{
          height: 56,
          px: 2.25,
          py: 0,
          borderBottom: 1,
          borderColor: "divider",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 650, color: "text.secondary", fontSize: "0.68rem", letterSpacing: "0.08em" }}
          >
            Generated App
          </Typography>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: statusConfig.color,
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.75rem", color: "text.secondary" }}>
              {statusConfig.label}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
          <Tooltip title="Preview">
            <IconButton
              aria-label="Preview"
              onClick={() => onTabChange?.("preview")}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                color: tab === "preview" ? "text.primary" : "text.secondary",
                bgcolor: tab === "preview" ? "#f6f3ee" : "transparent",
                "&:hover": { bgcolor: "#f6f3ee" },
              }}
            >
              <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Code">
            <IconButton
              aria-label="Code"
              onClick={() => onTabChange?.("code")}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                color: tab === "code" ? "text.primary" : "text.secondary",
                bgcolor: tab === "code" ? "#f6f3ee" : "transparent",
                "&:hover": { bgcolor: "#f6f3ee" },
              }}
            >
              <CodeRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Publish">
            <span>
              <IconButton
                aria-label="Publish"
                disabled={!canPublish}
                onClick={() => {
                  if (!sessionId) {
                    return;
                  }
                  setPublishing(true);
                  setPublishNote(null);
                  void publishSession(sessionId, {})
                    .then((result) => setPublishNote(`Saved “${result.tool.name}” to your dashboard`))
                    .catch((error: unknown) =>
                      setPublishNote(error instanceof Error ? error.message : "Publish failed.")
                    )
                    .finally(() => setPublishing(false));
                }}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "9px",
                  bgcolor: "primary.main",
                  color: "#fff",
                  "&:hover": { bgcolor: "primary.dark" },
                  "&.Mui-disabled": { bgcolor: "primary.main", color: "#fff", opacity: 1 },
                }}
              >
                <RocketLaunchRoundedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
          {publishNote ? (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 140 }} title={publishNote}>
              {publishNote}
            </Typography>
          ) : null}
          {showFrame && (
            <Tooltip title="Refresh preview">
              <IconButton
                size="small"
                onClick={() => window.location.reload()}
                sx={{ ml: 0.5 }}
              >
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <EventLogButton events={events} />
          {split ? (
            <Tooltip title="Hide chat">
              <IconButton aria-label="Hide chat" onClick={split.collapseChat} sx={{ width: 32, height: 32, color: "text.secondary" }}>
                <KeyboardTabRoundedIcon sx={{ fontSize: 18, transform: "scaleX(-1)" }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>

      {/* Content area */}
      {showFrame && tab === "preview" ? (
        <Box sx={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {status === "updating" ? (
            <LinearProgress
              sx={{ 
                position: "absolute", 
                top: 0, 
                left: 0, 
                right: 0, 
                zIndex: 2,
                height: 3 
              }}
            />
          ) : null}
          <Box
            key={refreshKey}
            component="iframe"
            ref={iframeRef}
            title="Generated app preview"
            src={streamDocument ? undefined : src ?? undefined}
            srcDoc={streamDocument ?? undefined}
            onLoad={handleFrameLoad}
            sandbox="allow-scripts allow-same-origin allow-forms"
            sx={{
              display: "block",
              flex: 1,
              width: "100%",
              height: "100%",
              minHeight: 0,
              border: 0,
              bgcolor: "background.paper",
            }}
          />
        </Box>
      ) : null}

      {tab === "code" ? (
        <CodePanel files={files} />
      ) : showFrame ? null : (
        <PreviewPlaceholder
          status={status === "live" || status === "draft" || status === "updating" ? "idle" : status}
        />
      )}
    </Box>
  );
}
