import { useEffect, useMemo, useRef } from "react";
import KeyboardTabRoundedIcon from "@mui/icons-material/KeyboardTabRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Box, Button, CircularProgress, IconButton, LinearProgress, Stack, Tooltip, Typography } from "@mui/material";
import type { FileMap, RuntimeErrorRequest, SessionEvent } from "@terrarium/contracts";
import { useSplitControls } from "../layout/SplitControls";
import { CodePanel } from "./CodePanel";
import { EventLogButton } from "./EventLogButton";
import { applyPreviewDocument } from "../../utils/domMorpher";
import { fileMapToPreviewDocument } from "../../utils/previewDocument";

export type PreviewStatus = "idle" | "intent" | "clarify" | "ready" | "live" | "draft" | "updating";

const STATUS_CONFIG: Record<PreviewStatus, { label: string; color: string }> = {
  idle: { label: "No preview", color: "text.secondary" },
  intent: { label: "Processing...", color: "primary.main" },
  clarify: { label: "Waiting for input", color: "warning.main" },
  ready: { label: "Ready to build", color: "success.main" },
  draft: { label: "Draft", color: "warning.main" },
  updating: { label: "Updating...", color: "primary.main" },
  live: { label: "Live", color: "success.main" },
};

const COPY: Record<Exclude<PreviewStatus, "live" | "draft" | "updating">, { title: string; detail: string; icon: string }> = {
  idle: {
    title: "No preview yet",
    detail: "Start by describing what app you'd like to build in the chat. I'll guide you through a few questions, then generate a live preview.",
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
    <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 320, mt: 3 }}>
      <Box className="preview-skel-bar" sx={{ height: 12, width: "75%", borderRadius: 1.5 }} />
      <Box className="preview-skel-bar" sx={{ height: 12, width: "100%", borderRadius: 1.5 }} />
      <Box className="preview-skel-bar" sx={{ height: 12, width: "90%", borderRadius: 1.5 }} />
      <Box className="preview-skel-bar" sx={{ height: 80, width: "100%", mt: 1, borderRadius: 2 }} />
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
      <Stack sx={{ alignItems: "center", maxWidth: 480, textAlign: "center" }}>
        {active ? (
          <Box sx={{ mb: 2 }}>
            <CircularProgress size={40} thickness={3.5} />
          </Box>
        ) : (
          <Typography sx={{ fontSize: "3rem", mb: 2 }}>{copy.icon}</Typography>
        )}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 400 }}>
          {copy.detail}
        </Typography>
        {active ? <SkeletonBars /> : null}
      </Stack>
    </Box>
  );
}

/**
 * Normalise a sandbox previewUrl for the iframe src.
 */
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const src = previewUrl ? iframeSrc(previewUrl) : null;
  const streamDocument = useMemo(() => fileMapToPreviewDocument(streamFiles), [streamFiles]);
  const showFrame = Boolean(src || streamDocument) && (status === "live" || status === "draft" || status === "updating");
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
          px: 2.5,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 600, color: "text.secondary", fontSize: "0.75rem" }}
          >
            Generated App
          </Typography>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: statusConfig.color === "success.main" ? "success.light" : "background.default",
              border: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: statusConfig.color,
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem", color: statusConfig.color }}>
              {statusConfig.label}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button
            size="small"
            variant={tab === "preview" ? "contained" : "outlined"}
            color={tab === "preview" ? "primary" : "inherit"}
            startIcon={<VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => onTabChange?.("preview")}
            sx={{ minWidth: 100, fontWeight: 500, textTransform: "none" }}
          >
            Preview
          </Button>
          <Button
            size="small"
            variant={tab === "code" ? "contained" : "outlined"}
            color={tab === "code" ? "primary" : "inherit"}
            startIcon={<CodeRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => onTabChange?.("code")}
            sx={{ minWidth: 100, fontWeight: 500, textTransform: "none" }}
          >
            Code
          </Button>
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
              <IconButton size="small" aria-label="Hide chat" onClick={split.collapseChat}>
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
