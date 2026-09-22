import { useEffect, useState } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import type { ToolSummary } from "@terrarium/contracts";
import { fetchWorkspaceTools, sleepWorkspaceTool } from "../../api/sessions";

type WorkspaceDashboardProps = {
  onOpenTool: (toolId: string) => Promise<void>;
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

export function WorkspaceDashboard({ onOpenTool }: WorkspaceDashboardProps) {
  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busyTool, setBusyTool] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setStatus(null);
    try {
      setTools(await fetchWorkspaceTools());
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
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, color: "error.dark", bgcolor: "rgba(252,232,230,0.76)", backdropFilter: "blur(18px)" }}>
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
              Build an app, then use Publish from the preview header to save it here.
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
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 680 }}>
                      {tool.summary || "Published Terrarium app"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                      {tool.fileCount ?? 0} files • Updated {formatDate(tool.updatedAt)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Button disabled={busyTool === tool.id} variant="contained" onClick={() => void open(tool.id)}>
                      Open
                    </Button>
                    <Button disabled={busyTool === tool.id} variant="outlined" color="inherit" onClick={() => void sleep(tool.id)}>
                      Sleep
                    </Button>
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
