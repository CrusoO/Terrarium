import { useEffect, useMemo, useState, type ReactNode } from "react";
import BedtimeRoundedIcon from "@mui/icons-material/BedtimeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ToolSummary } from "@terrarium/contracts";
import { getMyAccessRequests, requestAppAccess, type AccessRequest } from "../../api/groups";
import { fetchWorkspaceTools, sleepWorkspaceTool, wakeWorkspaceTool } from "../../api/sessions";

type WorkspaceDashboardProps = {
  onOpenTool: (toolId: string) => Promise<void>;
  currentUserId: string;
  currentUserEmail: string;
};

type StatusFilter = "all" | "running" | "sleeping";
type SortKey = "updated" | "name";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "sleeping", label: "Sleeping" },
];

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

function initial(name: string): string {
  const letter = name.trim().charAt(0).toUpperCase();
  return letter || "A";
}

function statusTone(status: ToolSummary["status"]): { label: string; color: string; bg: string } {
  if (status === "running") return { label: "running", color: "#1f8a4c", bg: "#e7f6ee" };
  if (status === "sleeping") return { label: "sleeping", color: "#8a6d12", bg: "#fbf3d5" };
  if (status === "unhealthy") return { label: "unhealthy", color: "#9b2c2c", bg: "#fde8e6" };
  if (status === "booting") return { label: "booting", color: "#6e1429", bg: "#f6e8ec" };
  return { label: status, color: "#667085", bg: "#f3f2f0" };
}

export function WorkspaceDashboard({ onOpenTool, currentUserId, currentUserEmail }: WorkspaceDashboardProps) {
  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [requests, setRequests] = useState<Record<string, AccessRequest>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busyTool, setBusyTool] = useState<{ id: string; action: "open" | "wake" | "sleep" | "request" } | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("updated");

  async function refresh() {
    setLoading(true);
    setStatus(null);
    try {
      const [listed, mine] = await Promise.all([
        fetchWorkspaceTools(),
        currentUserId ? getMyAccessRequests(currentUserId) : Promise.resolve([]),
      ]);
      setTools(listed);
      setRequests(Object.fromEntries(mine.filter((item) => item.tool_id).map((item) => [item.tool_id, item])));
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
    setBusyTool({ id: toolId, action: "sleep" });
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

  async function wake(toolId: string) {
    setBusyTool({ id: toolId, action: "wake" });
    setStatus(null);
    try {
      await wakeWorkspaceTool(toolId);
      setTools(await fetchWorkspaceTools());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not wake this tool.");
    } finally {
      setBusyTool(null);
    }
  }

  async function open(toolId: string) {
    setBusyTool({ id: toolId, action: "open" });
    setStatus(null);
    try {
      await onOpenTool(toolId);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not open this tool.");
      setBusyTool(null);
    }
  }

  async function request(tool: ToolSummary) {
    setBusyTool({ id: tool.id, action: "request" });
    setStatus(null);
    try {
      const created = await requestAppAccess(tool.id, tool.name, tool.ownerId, currentUserId, currentUserEmail);
      setRequests((current) => ({ ...current, [tool.id]: created }));
      setStatus(`Edit request sent to ${tool.ownerEmail ?? "the app owner"}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send this request.");
    } finally {
      setBusyTool(null);
    }
  }

  const runningCount = tools.filter((tool) => tool.status === "running").length;
  const sleepingCount = tools.filter((tool) => tool.status === "sleeping").length;
  const fileCount = tools.reduce((total, tool) => total + (tool.fileCount ?? 0), 0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = tools.filter((tool) => {
      if (filter !== "all" && tool.status !== filter) return false;
      if (!needle) return true;
      return `${tool.name} ${tool.summary}`.toLowerCase().includes(needle);
    });
    next.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return next;
  }, [filter, query, sort, tools]);

  return (
    <Box className="workspace-stage" sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      <Stack spacing={2.25} sx={{ width: "100%", px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.12em" }}>
              Workspace
            </Typography>
            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#1f8a4c", flexShrink: 0 }} />
            <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>
              Published apps
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {runningCount} running
            </Typography>
          </Stack>
          <Button
            startIcon={<RefreshRoundedIcon />}
            variant="outlined"
            color="inherit"
            onClick={() => void refresh()}
            sx={{
              borderRadius: "999px",
              bgcolor: "#fff",
              borderColor: "divider",
              color: "text.primary",
              px: 2,
            }}
          >
            Refresh
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 1.5,
          }}
        >
          <StatCard icon={<GridViewRoundedIcon sx={{ fontSize: 18 }} />} tint="#f6e8ec" ink="#6e1429" value={tools.length} label="Total apps" />
          <StatCard icon={<BoltRoundedIcon sx={{ fontSize: 18 }} />} tint="#e7f6ee" ink="#1f8a4c" value={runningCount} label="Running" />
          <StatCard icon={<BedtimeRoundedIcon sx={{ fontSize: 18 }} />} tint="#fbf3d5" ink="#8a6d12" value={sleepingCount} label="Sleeping" />
          <StatCard icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: 18 }} />} tint="#f6e8ec" ink="#6e1429" value={fileCount} label="Files" />
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ alignItems: { md: "center" } }}>
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search apps"
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              maxWidth: { md: 420 },
              "& .MuiOutlinedInput-root": {
                bgcolor: "#fff",
                borderRadius: "12px",
              },
            }}
          />
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            {FILTERS.map((item) => {
              const selected = filter === item.id;
              return (
                <Button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  sx={{
                    minWidth: 0,
                    px: 1.75,
                    py: 0.6,
                    borderRadius: "999px",
                    bgcolor: selected ? "primary.main" : "#fff",
                    color: selected ? "#fff" : "text.primary",
                    border: "1px solid",
                    borderColor: selected ? "primary.main" : "divider",
                    "&:hover": {
                      bgcolor: selected ? "primary.dark" : "#fff",
                      borderColor: selected ? "primary.dark" : "divider",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Select
            size="small"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            sx={{
              bgcolor: "#fff",
              borderRadius: "12px",
              minWidth: 180,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
            }}
          >
            <MenuItem value="updated">Recently updated</MenuItem>
            <MenuItem value="name">Name</MenuItem>
          </Select>
        </Stack>

        {status ? (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: "14px",
              color: status.startsWith("Edit request sent") ? "success.dark" : "error.dark",
              bgcolor: status.startsWith("Edit request sent") ? "#e7f6ee" : "#fff",
            }}
          >
            <Typography variant="body2">{status}</Typography>
          </Paper>
        ) : null}

        {loading ? (
          <Stack sx={{ alignItems: "center", py: 8 }}>
            <CircularProgress size={28} sx={{ color: "primary.main" }} />
          </Stack>
        ) : tools.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: "16px", bgcolor: "#fff", borderColor: "divider" }}>
            <Typography sx={{ fontWeight: 700 }}>No published apps yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Build an app, then use Publish from the preview header to save it here.
            </Typography>
          </Paper>
        ) : visible.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: "16px", bgcolor: "#fff", borderColor: "divider" }}>
            <Typography sx={{ fontWeight: 700 }}>No apps match</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Try another search or filter.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {visible.map((tool) => {
              const tone = statusTone(tool.status);
              const busy = busyTool?.id === tool.id;
              const mine = tool.ownerId === currentUserId;
              return (
                <Paper
                  key={tool.id}
                  variant="outlined"
                  sx={{
                    px: 2,
                    py: 1.75,
                    borderRadius: "16px",
                    bgcolor: "#fff",
                    borderColor: "divider",
                    boxShadow: "0 10px 28px rgba(23, 24, 28, 0.04)",
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "12px",
                          bgcolor: "#f6e8ec",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {initial(tool.name)}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.35, flexWrap: "wrap" }}>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.98rem" }}>{tool.name}</Typography>
                          <Box
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.15,
                              borderRadius: "999px",
                              bgcolor: tone.bg,
                              color: tone.color,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              lineHeight: 1.6,
                            }}
                          >
                            {tone.label}
                          </Box>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={
                              mine
                                ? "Yours"
                                : tool.visibility === "all"
                                  ? "Everyone"
                                  : tool.groupName
                                    ? `Team · ${tool.groupName}`
                                    : "Your team"
                            }
                          />
                          {tool.myRole && tool.myRole !== "owner" ? (
                            <Chip size="small" variant="outlined" label={tool.myRole === "editor" ? "Can edit" : "View only"} />
                          ) : null}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
                          {tool.summary || "Published Terrarium app"}
                        </Typography>
                        {!mine && tool.ownerEmail ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            Built by {tool.ownerEmail}
                          </Typography>
                        ) : null}
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 0.85, color: "text.secondary" }}>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <InsertDriveFileOutlinedIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">{tool.fileCount ?? 0} files</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                            <ScheduleRoundedIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">Updated {formatDate(tool.updatedAt)}</Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                      <Button
                        disabled={busy}
                        variant="contained"
                        onClick={() => void open(tool.id)}
                        sx={{ minWidth: 84, borderRadius: "10px" }}
                      >
                        {busy && busyTool?.action === "open" ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Open"}
                      </Button>
                      {mine ? (
                        tool.status === "sleeping" ? (
                          <Button
                            disabled={busy}
                            variant="outlined"
                            color="inherit"
                            onClick={() => void wake(tool.id)}
                            sx={{ minWidth: 84, borderRadius: "10px", bgcolor: "#fff", borderColor: "divider", color: "text.primary" }}
                          >
                            {busy && busyTool?.action === "wake" ? <CircularProgress size={16} /> : "Wake"}
                          </Button>
                        ) : (
                          <Button
                            disabled={busy}
                            variant="outlined"
                            color="inherit"
                            onClick={() => void sleep(tool.id)}
                            sx={{ minWidth: 84, borderRadius: "10px", bgcolor: "#fff", borderColor: "divider", color: "text.primary" }}
                          >
                            {busy && busyTool?.action === "sleep" ? <CircularProgress size={16} /> : "Sleep"}
                          </Button>
                        )
                      ) : tool.myRole === "editor" || requests[tool.id]?.status === "approved" ? (
                        <Chip size="small" color="success" label="Edit approved" variant="outlined" />
                      ) : requests[tool.id]?.status === "pending" ? (
                        <Button disabled variant="outlined" sx={{ borderRadius: "10px" }}>
                          Edit requested
                        </Button>
                      ) : (
                        <Button
                          disabled={busy}
                          variant="outlined"
                          onClick={() => void request(tool)}
                          sx={{ borderRadius: "10px" }}
                        >
                          {busy && busyTool?.action === "request" ? (
                            <CircularProgress size={16} />
                          ) : requests[tool.id]?.status === "denied" ? (
                            "Request edit again"
                          ) : (
                            "Request edit"
                          )}
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

function StatCard({
  icon,
  tint,
  ink,
  value,
  label,
}: {
  icon: ReactNode;
  tint: string;
  ink: string;
  value: number;
  label: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: 1.75,
        py: 1.5,
        borderRadius: "16px",
        bgcolor: "#fff",
        borderColor: "divider",
        boxShadow: "0 8px 20px rgba(23, 24, 28, 0.03)",
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "12px",
            bgcolor: tint,
            color: ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1.15rem", lineHeight: 1.1 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
