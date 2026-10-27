import { useMemo, useState, type CSSProperties } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import type { CheckStep, FileMap, SessionEvent } from "@terrarium/contracts";
import type { Group } from "../../api/groups";
import { listGroups } from "../../api/groups";
import { publishSession } from "../../api/sessions";
import { runSessionPublishCheck } from "../../api/trust";
import { useAuth } from "../../hooks/useAuth";
import type { PreviewStatus } from "../canvas/PreviewPanel";
import { PrePublishPanel } from "../trust/PrePublishPanel";
import { fileMapToPreviewDocument } from "../../utils/previewDocument";

function Icon({ path }: { path: string }) {
  return <svg className="tw-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>;
}

function GitHubIcon() {
  return (
    <svg className="tw-icon tw-icon-fill" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.86 8.35 6.84 9.7.5.1.68-.22.68-.49v-1.72c-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.71 0 0 .84-.28 2.75 1.05A9.34 9.34 0 0 1 12 6.94c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.4.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.95.68 1.92v2.77c0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function payloadValue(payload: unknown, key: string): string {
  if (!payload || typeof payload !== "object") return "";
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function eventDetails(event: SessionEvent): string[] {
  const payload = event.payload;
  const provider = payloadValue(payload, "llmProvider") || payloadValue(payload, "codegenProvider");
  const model = payloadValue(payload, "llmModel") || payloadValue(payload, "codegenModel");
  const lines = [
    provider || model ? `Model: ${[provider, model].filter(Boolean).join(" / ")}` : "",
    payloadValue(payload, "stage") ? `Stage: ${payloadValue(payload, "stage")}` : "",
    payloadValue(payload, "message"),
    payloadValue(payload, "logs") ? `Error: ${payloadValue(payload, "logs")}` : "",
    payloadValue(payload, "error") ? `Error: ${payloadValue(payload, "error")}` : "",
    payloadValue(payload, "llmReason") ? `Reason: ${payloadValue(payload, "llmReason")}` : "",
    payloadValue(payload, "codegenReason") ? `Reason: ${payloadValue(payload, "codegenReason")}` : "",
  ].filter(Boolean);
  return [...new Set(lines)].slice(0, 4);
}

function eventHasError(event: SessionEvent): boolean {
  return Boolean(
    payloadValue(event.payload, "logs") ||
      payloadValue(event.payload, "error") ||
      event.name.includes("unhealthy") ||
      event.name.includes("exhausted") ||
      event.name.includes("failed")
  );
}

function eventAction(event: SessionEvent): string {
  const message = payloadValue(event.payload, "message");
  if (message) return message;
  if (event.name === "intent.classified") return "Understood the request and chose the next step.";
  if (event.name === "codegen.started") return "Started architecture/code generation.";
  if (event.name === "preview.stream.started") return "Started streaming preview files.";
  if (event.name === "preview.stream.file") return `Updated ${payloadValue(event.payload, "path") || "a preview file"}.`;
  if (event.name === "session.created") return "Created a new build session.";
  return "Recorded this build event.";
}

function iframeSrc(previewUrl: string): string {
  if (/\.[a-zA-Z0-9]+$/.test(previewUrl.split("?")[0] ?? "")) {
    return previewUrl;
  }
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

function htmlText(files: FileMap | null | undefined): string {
  return files?.["index.html"] ?? "";
}

function extractHtmlLabel(html: string): string {
  const title = html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1];
  const heading = html.match(/<h1[^>]*>(.*?)<\/h1>/is)?.[1];
  const candidate = title || heading || "Building your app preview";
  return candidate.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function BlueprintPreview({ files }: { files: FileMap }) {
  const label = extractHtmlLabel(htmlText(files));
  const paths = Object.keys(files).sort();
  const cssCount = paths.filter((path) => path.endsWith(".css")).length;
  const jsCount = paths.filter((path) => path.endsWith(".js") || path.endsWith(".jsx") || path.endsWith(".tsx")).length;

  return (
    <div className="tw-blueprint">
      <div className="tw-blueprint-card">
        <div className="tw-blueprint-top">
          <span className="tw-mono">Live preview loading</span>
          <span>{paths.length} files</span>
        </div>
        <div className="tw-blueprint-hero" aria-label={label}>
          <div className="tw-blueprint-copy" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="tw-blueprint-pulse" aria-hidden="true" />
        </div>
        <div className="tw-blueprint-grid" aria-hidden="true">
          <div className="wide"><span /><span /><span /></div>
          <div><span /><span /><span /></div>
          <div><span /><span /><span /></div>
          <div className="tall"><span /><span /><span /><span /></div>
          <div><span /><span /><span /></div>
          <div className="wide"><span /><span /><span /></div>
        </div>
        <div className="tw-blueprint-files">
          <span>HTML ready</span>
          <span>{cssCount} styles</span>
          <span>{jsCount} scripts</span>
        </div>
      </div>
    </div>
  );
}

type FileTreeRow = { type: "folder" | "file"; path: string; label: string; depth: number };

function fileTreeRows(paths: string[]): FileTreeRow[] {
  const rows: FileTreeRow[] = [];
  const seenFolders = new Set<string>();
  for (const path of paths) {
    const parts = path.split("/");
    let prefix = "";
    parts.slice(0, -1).forEach((part, depth) => {
      prefix = prefix ? `${prefix}/${part}` : part;
      if (!seenFolders.has(prefix)) {
        seenFolders.add(prefix);
        rows.push({ type: "folder", path: prefix, label: part, depth });
      }
    });
    rows.push({ type: "file", path, label: parts[parts.length - 1] ?? path, depth: parts.length - 1 });
  }
  return rows;
}

export function PreviewPanel({
  tab = "preview",
  onTabChange,
  appBuilt = false,
  events = [],
  files = null,
  streamFiles = null,
  previewUrl = null,
  previewStatus = "idle",
  previewKey = 0,
  sessionId = null,
}: {
  tab?: "preview" | "code" | "events";
  onTabChange?: (tab: "preview" | "code" | "events") => void;
  appBuilt?: boolean;
  events?: SessionEvent[];
  files?: FileMap | null;
  streamFiles?: FileMap | null;
  previewUrl?: string | null;
  previewStatus?: PreviewStatus;
  previewKey?: number;
  sessionId?: string | null;
}) {
  const [openEventKey, setOpenEventKey] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [trustOpen, setTrustOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkHealth, setCheckHealth] = useState<Awaited<ReturnType<typeof runSessionPublishCheck>> | null>(null);
  const [acknowledgeWarnings, setAcknowledgeWarnings] = useState(false);
  const [visibility, setVisibility] = useState<"all" | "group">("all");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [publishNote, setPublishNote] = useState<string | null>(null);
  const auth = useAuth();
  const userEmail = auth.state.status === "authenticated" ? auth.state.user.email ?? "" : "";
  const canPublish = Boolean(sessionId) && previewStatus === "live" && Boolean(previewUrl) && !publishing;
  const stepStatus = useMemo(() => {
    const map: Partial<Record<CheckStep, "running" | "passed" | "failed" | "skipped">> = {};
    for (const event of events) {
      if (event.name !== "check.step" || !event.payload) {
        continue;
      }
      const step = event.payload.step;
      const status = event.payload.status;
      if (typeof step === "string" && typeof status === "string") {
        map[step as CheckStep] = status as "running" | "passed" | "failed" | "skipped";
      }
    }
    return map;
  }, [events]);

  async function beginTrustCheck() {
    if (!sessionId) {
      setPublishNote("Build an app first, then publish.");
      return;
    }
    setTrustOpen(true);
    setChecking(true);
    setCheckHealth(null);
    try {
      setCheckHealth(await runSessionPublishCheck(sessionId));
    } catch (error) {
      setPublishNote(error instanceof Error ? error.message : "Publish check failed.");
      setTrustOpen(false);
    } finally {
      setChecking(false);
    }
  }
  const visibleFiles = streamFiles ?? files ?? {};
  const fileEntries = Object.entries(visibleFiles).sort(([left], [right]) => left.localeCompare(right));
  const selectedFilePath = selectedFile && visibleFiles[selectedFile] !== undefined ? selectedFile : fileEntries[0]?.[0] ?? null;
  const treeRows = useMemo(() => fileTreeRows(fileEntries.map(([path]) => path)), [fileEntries]);
  const streamDocument = useMemo(() => fileMapToPreviewDocument(streamFiles), [streamFiles]);
  const frameSrc = previewUrl ? iframeSrc(previewUrl) : null;
  const previewLabel =
    previewStatus === "live" ? "Live" :
    previewStatus === "updating" ? "Updating" :
    previewStatus === "draft" ? "Draft" :
    streamDocument ? "Loading preview" :
    "No preview";

  return (
    <>
    <section className="tw-preview" aria-label="Generated app preview">
      <header className="tw-preview-head">
        <div className="tw-preview-left"><span className="tw-preview-title">Generated app</span><span className="tw-preview-status"><span className="tw-green-dot" />{previewLabel}</span></div>
        <div className="tw-preview-actions">
          <button className={`tw-tool ${tab === "preview" ? "active" : ""}`} aria-label="Preview" data-tooltip="Preview" type="button" onClick={() => onTabChange?.("preview")}><Icon path="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /></button>
          <button className={`tw-tool ${tab === "code" ? "active" : ""}`} aria-label="Code" data-tooltip="Code" type="button" onClick={() => onTabChange?.("code")}><Icon path="M16 18l6-6-6-6M8 6l-6 6 6 6" /></button>
          <button className="tw-tool" aria-label="Git" data-tooltip={appBuilt ? "Git" : "Git is available after build"} type="button" disabled={!appBuilt}><GitHubIcon /></button>
          <button className="tw-stale" aria-label="Out of date" data-tooltip="Out of date"><Icon path="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2" />Out of date</button>
          <button
            className="tw-rocket"
            aria-label="Publish"
            data-tooltip={canPublish ? "Publish" : publishNote || "Publish is available after a live preview"}
            type="button"
            disabled={!canPublish}
            onClick={() => {
              setPublishNote(null);
              void beginTrustCheck();
              if (userEmail) {
                void listGroups(userEmail).then(setGroups).catch(() => setGroups([]));
              }
            }}
          >
            <Icon path="M5 15c5-7 8-10 14-10-1 6-3 9-10 14l-4-4z M9 19l-4 2 2-4 M14 7l3 3 M9 14l1 1" />
          </button>
          {publishNote ? <span className="tw-preview-status" title={publishNote}>{publishNote}</span> : null}
          <button className={`tw-tool ${tab === "events" ? "active" : ""}`} aria-label="Events" data-tooltip="Events" type="button" onClick={() => onTabChange?.("events")}><Icon path="M3 12h4l2-6 4 12 2-6h6" /></button>
        </div>
      </header>
      <div className="tw-preview-body">
        {tab === "preview" && frameSrc ? (
          <div className="tw-live-frame-wrap">
            <iframe
              key={`${previewKey}-${frameSrc ?? "stream"}`}
              className="tw-live-frame"
              title="Generated app preview"
              src={frameSrc ?? undefined}
              srcDoc={frameSrc ? undefined : streamDocument ?? undefined}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : tab === "preview" && streamDocument ? (
          <BlueprintPreview files={streamFiles ?? {}} />
        ) : tab === "code" ? (
          <article className="tw-panel-card" aria-label="Generated code files">
            <div className="tw-panel-head">
              <span className="tw-mono">Code files</span>
              <span>{fileEntries.length} files</span>
            </div>
            {fileEntries.length && selectedFilePath ? (
              <div className="tw-code-browser">
                <nav className="tw-file-tree" aria-label="Generated file structure">
                  {treeRows.map((row) =>
                    row.type === "folder" ? (
                      <div key={`folder-${row.path}`} className="tw-file-row folder" style={{ "--depth": row.depth } as CSSProperties}>
                        <span aria-hidden="true">▸</span>{row.label}
                      </div>
                    ) : (
                      <button
                        key={row.path}
                        className={`tw-file-row file ${row.path === selectedFilePath ? "active" : ""}`}
                        style={{ "--depth": row.depth } as CSSProperties}
                        type="button"
                        onClick={() => setSelectedFile(row.path)}
                      >
                        <span aria-hidden="true">•</span>{row.label}
                      </button>
                    )
                  )}
                </nav>
                <div className="tw-code-view">
                  <div className="tw-code-path">{selectedFilePath}</div>
                  <pre>{visibleFiles[selectedFilePath]}</pre>
                </div>
              </div>
            ) : (
              <p className="tw-empty-note">Code files will appear here once generation starts.</p>
            )}
          </article>
        ) : tab === "events" ? (
          <article className="tw-panel-card" aria-label="Session events">
            <div className="tw-panel-head">
              <span className="tw-mono">Events</span>
              <span>{events.length} total</span>
            </div>
            {events.length ? (
              <ol className="tw-event-list">
                {events.slice(-40).map((event, index) => {
                  const eventKey = `${event.at}-${event.name}-${index}`;
                  const expanded = openEventKey === eventKey;
                  const hasError = eventHasError(event);
                  const details = eventDetails(event);
                  return (
                  <li
                    key={eventKey}
                    role="button"
                    tabIndex={0}
                    className={`${expanded ? "expanded" : ""} ${hasError ? "error" : ""}`}
                    onClick={() => setOpenEventKey((current) => (current === eventKey ? null : eventKey))}
                    onKeyDown={(eventKeyDown) => {
                      if (eventKeyDown.key === "Enter" || eventKeyDown.key === " ") {
                        eventKeyDown.preventDefault();
                        setOpenEventKey((current) => (current === eventKey ? null : eventKey));
                      }
                    }}
                  >
                    <div className="tw-event-main">
                      <span>{event.name}</span>
                      {expanded ? (
                        <div className="tw-event-details">
                          <p><strong>Action:</strong> {eventAction(event)}</p>
                          {details.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <time>{new Date(event.at).toLocaleTimeString()}</time>
                  </li>
                  );
                })}
              </ol>
            ) : (
              <p className="tw-empty-note">Agent events will appear here while Terra works.</p>
            )}
          </article>
        ) : (
          <article className="tw-intro">
            <div className="tw-empty-icon" aria-hidden="true">
              <Icon path="M5 4h14v10H5z M12 14v4 M8 20h8" />
            </div>
            <h1>Nothing built yet</h1>
            <p>Start with a head start, or tell Terra what you need.</p>
          </article>
        )}
      </div>
    </section>
      <PrePublishPanel
        open={trustOpen}
        onClose={() => !checking && setTrustOpen(false)}
        health={checkHealth}
        stepStatus={stepStatus}
        publishing={publishing}
        checking={checking}
        onFixAutomatically={() => {
          setPublishNote("Auto-fix is available after the app is saved as a draft.");
        }}
        onPublish={(ackWarnings) => {
          setAcknowledgeWarnings(ackWarnings);
          setTrustOpen(false);
          setPublishOpen(true);
        }}
      />
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
                acknowledgeWarnings: acknowledgeWarnings || undefined,
              })
                .then((result) => {
                  setPublishNote(
                    result.tool.visibility === "group"
                      ? `Saved “${result.tool.name}” for ${result.tool.groupName ?? "your team"}`
                      : `Saved “${result.tool.name}” for everyone`,
                  );
                  setPublishOpen(false);
                })
                .catch((error: unknown) =>
                  setPublishNote(error instanceof Error ? error.message : "Publish failed."),
                )
                .finally(() => setPublishing(false));
            }}
          >
            {publishing ? "Publishing…" : "Publish"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
