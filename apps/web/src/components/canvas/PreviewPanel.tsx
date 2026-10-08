import { useEffect, useMemo, useRef, useState } from "react";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import KeyboardTabRoundedIcon from "@mui/icons-material/KeyboardTabRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { FileMap, GitHubStatusResponse, RuntimeErrorRequest, SessionEvent } from "@terrarium/contracts";
import { useSplitControls } from "../layout/SplitControls";
import { CodePanel } from "./CodePanel";
import { EventLogButton } from "./EventLogButton";
import {
  connectGitHubToken,
  fetchGitHubStatus,
  pushSessionToGitHub,
} from "../../api/github";
import { listGroups, type Group } from "../../api/groups";
import { publishSession } from "../../api/sessions";
import { useAuth } from "../../hooks/useAuth";
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

/** Absolute URL so the child app can open in a new browser tab. */
export function previewHref(previewUrl: string): string {
  const src = iframeSrc(previewUrl);
  if (/^https?:\/\//i.test(src)) {
    return src;
  }
  if (typeof window === "undefined") {
    return src;
  }
  return new URL(src, window.location.origin).href;
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
  const [publishOpen, setPublishOpen] = useState(false);
  const [visibility, setVisibility] = useState<"all" | "group">("all");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const [githubStatus, setGithubStatus] = useState<GitHubStatusResponse | null>(null);
  const [githubBusy, setGithubBusy] = useState(false);
  const [githubNote, setGithubNote] = useState<string | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubSetupOpen, setGithubSetupOpen] = useState(false);
  const [githubAddAccount, setGithubAddAccount] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [githubRepoName, setGithubRepoName] = useState("");
  const [githubPrivate, setGithubPrivate] = useState(true);
  const githubReturnHandled = useRef(false);
  const auth = useAuth();
  const signedIn = auth.state.status === "authenticated";
  const userEmail = signedIn ? auth.state.user.email ?? "" : "";
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const src = previewUrl ? iframeSrc(previewUrl) : null;
  const streamDocument = useMemo(() => fileMapToPreviewDocument(streamFiles), [streamFiles]);
  const showFrame = Boolean(src || streamDocument) && (status === "live" || status === "draft" || status === "updating");
  const canPublish = Boolean(sessionId) && status === "live" && !publishing;
  const canGitHub = Boolean(sessionId) && signedIn && !githubBusy;
  const githubHasAccount = Boolean(githubStatus?.connected);
  const githubHasRepo = Boolean(githubStatus?.htmlUrl);
  const statusConfig = STATUS_CONFIG[status];

  useEffect(() => {
    if (!sessionId || !signedIn) {
      return;
    }
    void fetchGitHubStatus(sessionId)
      .then(setGithubStatus)
      .catch(() => setGithubStatus(null));
  }, [sessionId, signedIn]);

  useEffect(() => {
    if (githubReturnHandled.current || !signedIn || typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("github");
    if (!flag) {
      return;
    }
    githubReturnHandled.current = true;
    const returnedSession = params.get("session") || sessionId;
    params.delete("github");
    params.delete("session");
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", next);
    if (returnedSession) {
      void fetchGitHubStatus(returnedSession).then(setGithubStatus).catch(() => undefined);
    }
  }, [sessionId, signedIn]);

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
          <Tooltip
            title={
              githubStatus?.htmlUrl
                ? `Push to ${githubStatus.repo ?? "GitHub"}`
                : githubStatus?.connected
                  ? "Create GitHub repo and push"
                  : "Connect GitHub and push this app"
            }
          >
            <span>
              <IconButton
                aria-label="Push to GitHub"
                disabled={!canGitHub}
                onClick={() => {
                  if (!sessionId) {
                    setGithubNote("Build an app first, then push it.");
                    return;
                  }
                  if (!signedIn) {
                    setGithubNote("Sign in to Terrarium first.");
                    return;
                  }
                  setGithubError(null);
                  setGithubToken("");
                  setGithubAddAccount(false);
                  setGithubRepoName(sessionId ? `terrarium-app-${sessionId.slice(0, 8)}` : "terrarium-app");
                  setGithubPrivate(true);
                  setGithubSetupOpen(true);
                }}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  color: githubStatus?.connected ? "#fff" : "text.secondary",
                  bgcolor: githubStatus?.connected ? "#24292f" : "transparent",
                  "&:hover": { bgcolor: githubStatus?.connected ? "#1b1f23" : "#f6f3ee" },
                }}
              >
                <GitHubIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
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
                  setPublishNote(null);
                  setPublishOpen(true);
                  if (userEmail) {
                    void listGroups(userEmail).then(setGroups).catch(() => setGroups([]));
                  }
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
          {githubNote ? (
            <Typography component="span" variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180 }} title={githubNote}>
              {githubStatus?.htmlUrl ? (
                <Box
                  component="a"
                  href={githubStatus.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "inherit", textDecoration: "underline" }}
                >
                  {githubNote}
                </Box>
              ) : (
                githubNote
              )}
            </Typography>
          ) : null}
          {showFrame && src ? (
            <Tooltip title="Open in new tab">
              <IconButton
                component="a"
                href={previewHref(previewUrl ?? src)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open preview in new tab"
                size="small"
                sx={{ ml: 0.5, color: "text.secondary" }}
              >
                <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
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

      <Dialog
        open={githubSetupOpen}
        onClose={() => !githubBusy && setGithubSetupOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "20px",
            border: "1px solid #efeae4",
            boxShadow: "0 28px 64px rgba(47, 36, 28, 0.16)",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.25,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: "#24292f",
            color: "#fff",
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: "#fff",
              color: "#24292f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GitHubIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              {githubHasRepo ? "GitHub repository" : "Push this app to GitHub"}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, display: "block" }}>
              {githubHasRepo
                ? "Keep this repo, or switch to another GitHub account"
                : githubHasAccount
                  ? "Use your linked account, or add a different one"
                  : "Choose the repo name and whether it is public or private"}
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {githubHasAccount && !githubAddAccount ? (
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "14px",
                  border: "1px solid #efeae4",
                  bgcolor: "#faf7f4",
                }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 650 }}>
                  {githubHasRepo ? "Linked repository" : "Linked GitHub account"}
                </Typography>
                <Typography sx={{ fontWeight: 700, mt: 0.25 }}>
                  {githubHasRepo
                    ? githubStatus?.repo ?? githubStatus?.login ?? "GitHub"
                    : githubStatus?.login
                      ? `@${githubStatus.login}`
                      : "GitHub"}
                </Typography>
                {githubStatus?.login ? (
                  <Typography variant="body2" color="text.secondary">
                    {githubHasRepo
                      ? `Connected as @${githubStatus.login}`
                      : "Choose a name and visibility, then push this child app"}
                  </Typography>
                ) : null}
              </Box>
              {githubNote ? (
                <Alert icon={<CheckRoundedIcon fontSize="inherit" />} severity="success" sx={{ borderRadius: "12px" }}>
                  {githubNote}
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {githubHasRepo
                    ? "Push the latest files to this repo, or connect a different GitHub account."
                    : "Use this account for the new app, or add a different GitHub token."}
                </Typography>
              )}
              <Button
                onClick={() => {
                  setGithubAddAccount(true);
                  setGithubError(null);
                  setGithubNote(null);
                }}
                sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 650, px: 0 }}
              >
                Use a different GitHub account
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {githubAddAccount
                  ? "Paste a token from the other GitHub account. This app will be pushed there."
                  : "Paste a GitHub personal access token, choose the repo name and visibility, then push this child app."}
              </Typography>
              <Button
                href="https://github.com/settings/tokens/new?scopes=repo&description=Terrarium"
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                startIcon={<OpenInNewRoundedIcon />}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 650,
                  borderColor: "#d9d0c8",
                  color: "text.primary",
                }}
              >
                Create token on GitHub
              </Button>
              <TextField
                autoFocus
                fullWidth
                type="password"
                label="Personal access token"
                placeholder="ghp_••••••••••••••••"
                value={githubToken}
                onChange={(event) => {
                  setGithubToken(event.target.value);
                  setGithubError(null);
                }}
                InputProps={{
                  startAdornment: <LockOutlinedIcon sx={{ mr: 1, color: "text.secondary", fontSize: 18 }} />,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }}
              />
              {githubAddAccount ? (
                <Button
                  onClick={() => {
                    setGithubAddAccount(false);
                    setGithubToken("");
                    setGithubError(null);
                  }}
                  sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 650, px: 0 }}
                >
                  Back to linked account
                </Button>
              ) : null}
            </Stack>
          )}
          {!githubHasRepo || githubAddAccount ? (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Repository name"
                value={githubRepoName}
                onChange={(event) => setGithubRepoName(event.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }}
              />
              <Typography variant="caption" sx={{ fontWeight: 650, color: "text.secondary" }}>
                Visibility
              </Typography>
              <RadioGroup
                value={githubPrivate ? "private" : "public"}
                onChange={(event) => setGithubPrivate(event.target.value === "private")}
              >
                <FormControlLabel
                  value="private"
                  control={<Radio size="small" />}
                  label="Private — only you can see this repo"
                />
                <FormControlLabel
                  value="public"
                  control={<Radio size="small" />}
                  label="Public — anyone on GitHub can see this repo"
                />
              </RadioGroup>
            </Stack>
          ) : null}
          {githubError ? (
            <Alert severity="error" sx={{ mt: 2, borderRadius: "12px" }}>
              {githubError}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setGithubSetupOpen(false)}
            disabled={githubBusy}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Close
          </Button>
          {githubStatus?.htmlUrl && !githubAddAccount ? (
            <Button
              href={githubStatus.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textTransform: "none", fontWeight: 650 }}
            >
              Open repo
            </Button>
          ) : null}
          <Button
            variant="contained"
            disabled={
              githubBusy ||
              !sessionId ||
              ((githubAddAccount || !githubHasAccount) && githubToken.trim().length < 8) ||
              ((!githubHasRepo || githubAddAccount) && !githubRepoName.trim())
            }
            onClick={() => {
              if (!sessionId) {
                return;
              }
              setGithubBusy(true);
              setGithubError(null);
              const createOptions = {
                repoName: githubRepoName.trim(),
                private: githubPrivate,
              };
              const work =
                githubAddAccount || !githubHasAccount
                  ? connectGitHubToken(githubToken.trim(), sessionId, {
                      setDefault: !githubHasAccount,
                      replaceRepo: githubAddAccount,
                    }).then(() => pushSessionToGitHub(sessionId, createOptions))
                  : githubHasRepo
                    ? pushSessionToGitHub(sessionId)
                    : pushSessionToGitHub(sessionId, createOptions);
              void work
                .then((result) => {
                  setGithubNote(result.created ? `Created ${result.repo}` : `Pushed to ${result.repo}`);
                  setGithubToken("");
                  setGithubAddAccount(false);
                  return fetchGitHubStatus(sessionId);
                })
                .then((statusResult) => {
                  if (statusResult) {
                    setGithubStatus(statusResult);
                  }
                })
                .catch((error: unknown) =>
                  setGithubError(error instanceof Error ? error.message : "GitHub connect failed.")
                )
                .finally(() => setGithubBusy(false));
            }}
            sx={{
              ml: "auto",
              px: 2.25,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#24292f",
              "&:hover": { bgcolor: "#1b1f23" },
            }}
            startIcon={
              githubBusy ? <CircularProgress size={14} color="inherit" /> : <GitHubIcon sx={{ fontSize: 18 }} />
            }
          >
            {githubBusy
              ? "Pushing…"
              : githubAddAccount
                ? "Connect new account and push"
                : githubHasRepo
                  ? "Push latest"
                  : githubHasAccount
                    ? "Push this app"
                    : "Connect and push"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={publishOpen} onClose={() => !publishing && setPublishOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Publish</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Who can use this app?
          </Typography>
          <FormControl>
            <RadioGroup
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as "all" | "group")}
            >
              <FormControlLabel value="all" control={<Radio />} label="Everyone" />
              <FormControlLabel value="group" control={<Radio />} label="Your team" />
            </RadioGroup>
          </FormControl>
          {visibility === "group" ? (
            <FormControl fullWidth sx={{ mt: 2 }}>
              {groups.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Create a team first.
                </Typography>
              ) : (
                <Box
                  component="select"
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                  sx={{
                    mt: 0.5,
                    p: 1.25,
                    borderRadius: 1,
                    border: 1,
                    borderColor: "divider",
                    font: "inherit",
                    bgcolor: "background.paper",
                  }}
                >
                  <option value="">Select a team</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Box>
              )}
            </FormControl>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishOpen(false)} disabled={publishing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={publishing || (visibility === "group" && !groupId)}
            onClick={() => {
              if (!sessionId) {
                return;
              }
              const selected = groups.find((group) => group.id === groupId);
              setPublishing(true);
              void publishSession(sessionId, {
                visibility,
                groupId: visibility === "group" ? groupId : undefined,
                groupName: visibility === "group" ? selected?.name : undefined,
              })
                .then((result) => {
                  setPublishNote(
                    result.tool.visibility === "group"
                      ? `Saved “${result.tool.name}” for ${result.tool.groupName ?? "your team"}`
                      : `Saved “${result.tool.name}” for everyone`
                  );
                  setPublishOpen(false);
                })
                .catch((error: unknown) =>
                  setPublishNote(error instanceof Error ? error.message : "Publish failed.")
                )
                .finally(() => setPublishing(false));
            }}
          >
            {publishing ? "Publishing…" : "Publish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
