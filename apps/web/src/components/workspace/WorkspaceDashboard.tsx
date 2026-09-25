import { useEffect, useState } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import type { ToolSummary } from "@terrarium/contracts";
import { getMyAccessRequests, requestAppAccess, type AccessRequest } from "../../api/groups";
import { fetchWorkspaceTools, sleepWorkspaceTool } from "../../api/sessions";

type WorkspaceDashboardProps = {
  onOpenTool: (toolId: string) => Promise<void>;
  currentUserId: string;
  currentUserEmail: string;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusColor(status: ToolSummary["status"]): "success" | "warning" | "default" | "error" {
  if (status === "running") return "success";
  if (status === "sleeping") return "warning";
  if (status === "unhealthy") return "error";
  return "default";
}

export function WorkspaceDashboard({ onOpenTool, currentUserId, currentUserEmail }: WorkspaceDashboardProps) {
  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [requests, setRequests] = useState<Record<string, AccessRequest>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busyTool, setBusyTool] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setStatus(null);
    try {
      const [listed, mine] = await Promise.all([
        fetchWorkspaceTools(),
        getMyAccessRequests(currentUserId),
      ]);
      setTools(listed);
      setRequests(Object.fromEntries(mine.filter((r) => r.tool_id).map((r) => [r.tool_id, r])));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load workspace tools.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function sleep(toolId: string) {
    setBusyTool(toolId);
    setStatus(null);
    try {
      const updated = await sleepWorkspaceTool(toolId);
      setTools((current) => current.map((tool) => (tool.id === toolId ? updated : tool)));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not sleep this tool.");
    } finally {
      setBusyTool(null);
    }
  }

  async function open(toolId: string) {
    setBusyTool(toolId);
    setStatus(null);
    try {
      await onOpenTool(toolId);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not open this tool.");
    } finally {
      setBusyTool(null);
    }
  }

  async function request(tool: ToolSummary) {
    setBusyTool(tool.id);
    setStatus(null);
    try {
      const created = await requestAppAccess(
        tool.id,
        tool.name,
        tool.ownerId,
        currentUserId,
        currentUserEmail
      );
      setRequests((current) => ({ ...current, [tool.id]: created }));
      setStatus(`Edit request sent to ${tool.ownerEmail ?? "the app owner"}. They will see it under Approvals.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send this request.");
    } finally {
      setBusyTool(null);
    }
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "transparent", p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1040, mx: "auto" }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Workspace
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.03em" }}>
              Published apps
            </Typography>
          </Box>
          <Button startIcon={<RefreshRoundedIcon />} variant="outlined" color="inherit" onClick={refresh}>
            Refresh
          </Button>
        </Stack>

        {status ? (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              color: status.startsWith("Request sent") ? "success.dark" : "error.dark",
              bgcolor: status.startsWith("Request sent") ? "rgba(232,245,233,0.8)" : "rgba(252,232,230,0.76)",
              backdropFilter: "blur(18px)",
            }}
          >
            <Typography variant="body2">{status}</Typography>
          </Paper>
        ) : null}

        {loading ? (
          <Stack sx={{ alignItems: "center", py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : tools.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, bgcolor: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", boxShadow: "var(--shadow-glass)" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              No published apps yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Apps published for everyone, plus apps shared with your groups, show up here. Open to use. Request edit if you need to change someone else's app.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {tools.map((tool) => (
              <Paper
                key={tool.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 18px 48px rgba(31, 20, 24, 0.08)",
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.75 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {tool.name}
                      </Typography>
                      <Chip size="small" color={statusColor(tool.status)} label={tool.status} variant="outlined" />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={
                          tool.ownerId === currentUserId
                            ? "Yours"
                            : tool.visibility === "all"
                              ? "Everyone"
                              : tool.groupName
                                ? `Group · ${tool.groupName}`
                                : "Your group"
                        }
                      />
                      {tool.myRole && tool.myRole !== "owner" ? (
                        <Chip size="small" variant="outlined" label={tool.myRole === "editor" ? "Can edit" : "View only"} />
                      ) : null}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 680 }}>
                      {tool.summary || "Published Terrarium app"}
                    </Typography>
                    {tool.ownerId !== currentUserId && tool.ownerEmail ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        Built by {tool.ownerEmail}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                      {tool.fileCount ?? 0} files • Updated {formatDate(tool.updatedAt)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Button disabled={busyTool === tool.id} variant="contained" onClick={() => void open(tool.id)}>
                      Open
                    </Button>
                    {tool.ownerId === currentUserId ? (
                      <Button disabled={busyTool === tool.id} variant="outlined" color="inherit" onClick={() => void sleep(tool.id)}>
                        Sleep
                      </Button>
                    ) : tool.myRole === "editor" || requests[tool.id]?.status === "approved" ? (
                      <Chip size="small" color="success" label="Edit approved" variant="outlined" />
                    ) : requests[tool.id]?.status === "pending" ? (
                      <Button disabled variant="outlined">
                        Edit requested
                      </Button>
                    ) : (
                      <Button disabled={busyTool === tool.id} variant="outlined" onClick={() => void request(tool)}>
                        {requests[tool.id]?.status === "denied" ? "Request edit again" : "Request edit"}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
