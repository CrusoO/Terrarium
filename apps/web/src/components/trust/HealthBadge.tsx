import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import type { ToolHealth } from "@terrarium/contracts";

type Props = { health?: ToolHealth | null; loading?: boolean };

export function HealthBadge({ health, loading }: Props) {
  if (loading || health?.status === "checking") {
    return <Chip size="small" icon={<CircularProgress size={14} />} label="Checking" variant="outlined" />;
  }
  if (!health || health.status === "stale") {
    return (
      <Chip
        size="small"
        icon={<AccessTimeIcon fontSize="small" />}
        label="Out of date"
        variant="outlined"
        color="default"
      />
    );
  }
  if (health.status === "healthy") {
    return <Chip size="small" label="Healthy" color="success" />;
  }
  if (health.status === "warning") {
    const n = health.vulnerabilities.medium + health.vulnerabilities.low;
    return <Chip size="small" label={`Needs attention · ${n} low/medium`} color="warning" />;
  }
  const top = health.blockingReasons[0] ?? "Blocked";
  return <Chip size="small" label={`Unsafe · ${top}`} color="error" />;
}
