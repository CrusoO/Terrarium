import { useEffect, useRef, useState, type ReactNode } from "react";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  fetchTrustReport,
  fixTrustReport,
  restoreTrustReport,
  type TrustCheck,
  type TrustFixResult,
  type TrustReport,
  type TrustSeverity,
} from "../../api/trust";

type Props = { toolId: string; onChanged?: () => void };

const STATUS_TONE = {
  healthy: { label: "Healthy", color: "#1f8a4c", bg: "#e7f6ee", ring: "#2e9e5b" },
  attention: { label: "Needs attention", color: "#8a6d12", bg: "#fbf3d5", ring: "#d4a017" },
  unsafe: { label: "Unsafe", color: "#9b2c2c", bg: "#fde8e6", ring: "#c62828" },
} as const;

const SEVERITY_TONE: Record<TrustSeverity, { color: string; bg: string }> = {
  critical: { color: "#fff", bg: "#9b1c1c" },
  high: { color: "#9b2c2c", bg: "#fde8e6" },
  medium: { color: "#8a6d12", bg: "#fbf3d5" },
  low: { color: "#475467", bg: "#f2f4f7" },
  info: { color: "#475467", bg: "#f2f4f7" },
};

const FIX_STEPS = [
  "Reading the failing checks",
  "Applying codemods for known patterns",
  "Asking the Editor Agent to patch the code under test",
  "Re-running node --test in the sandbox",
  "Re-running the security scan",
  "Publishing the fixed version",
];

function ScoreRing({ score, tone, size = 46 }: { score: number; tone: string; size?: number }) {
  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <CircularProgress variant="determinate" value={100} size={size} thickness={4} sx={{ color: "#eceae6", position: "absolute" }} />
      <CircularProgress variant="determinate" value={score} size={size} thickness={4} sx={{ color: tone, position: "absolute" }} />
      <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ fontWeight: 800, fontSize: size > 40 ? "0.95rem" : "0.75rem" }}>{score}</Typography>
      </Box>
    </Box>
  );
}

function SeverityChip({ severity }: { severity: TrustSeverity }) {
  const tone = SEVERITY_TONE[severity];
  return (
    <Box
      component="span"
      sx={{
        px: 0.75,
        borderRadius: "6px",
        fontSize: "0.66rem",
        fontWeight: 800,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        color: tone.color,
        bgcolor: tone.bg,
        lineHeight: 1.7,
      }}
    >
      {severity}
    </Box>
  );
}

function StatusIcon({ status }: { status: TrustCheck["status"] }) {
  if (status === "passed") return <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#2e9e5b" }} />;
  if (status === "failed") return <ErrorRoundedIcon sx={{ fontSize: 16, color: "#c62828" }} />;
  return <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 16, color: "#98a2b3" }} />;
}

function sourceLabel(check: TrustCheck): string {
  if (check.source === "node:test") return "node --test";
  if (check.source === "scanner") return "scanner";
  return "static check";
}

function Vulnerability({ check }: { check: TrustCheck }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: check.severity === "critical" || check.severity === "high" ? "#f5b5ae" : "#f0dc9a",
        borderLeft: "4px solid",
        borderLeftColor: check.severity === "critical" || check.severity === "high" ? "#c62828" : "#d4a017",
        borderRadius: "10px",
        bgcolor: "#fffafa",
        p: 1.25,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
        <SeverityChip severity={check.severity} />
        <Typography sx={{ fontWeight: 700, fontSize: "0.86rem" }}>{check.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {check.kind === "security" ? "Security" : "Test"} · {sourceLabel(check)}
        </Typography>
        {check.fix ? (
          <Chip
            size="small"
            label={check.fix === "codemod" ? "Auto-fix: codemod" : "Auto-fix: Editor Agent"}
            sx={{ height: 20, fontSize: "0.68rem", bgcolor: "#eef4ff", color: "#3538cd", ml: "auto !important" }}
          />
        ) : null}
      </Stack>
      <Typography variant="body2" sx={{ mt: 0.5, color: "#7a271a" }}>
        {check.detail}
      </Typography>
      {check.evidence.slice(0, 3).map((item, index) => (
        <Box
          key={`${item.file}-${index}`}
          sx={{ mt: 0.75, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.74rem" }}
        >
          <Box sx={{ color: "#475467" }}>
            {item.file}
            {item.line ? `:${item.line}` : ""}
          </Box>
          {item.snippet ? (
            <Box
              sx={{
                mt: 0.25,
                px: 1,
                py: 0.5,
                borderRadius: "6px",
                bgcolor: "#1d1f24",
                color: "#ffb4a8",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {item.line ? <span style={{ color: "#7d8590" }}>{item.line}  </span> : null}
              {item.snippet}
            </Box>
          ) : null}
        </Box>
      ))}
      {check.fixSummary ? (
        <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: "#3538cd" }}>
          Fix: {check.fixSummary}
        </Typography>
      ) : null}
    </Box>
  );
}

function CheckList({ title, icon, checks }: { title: string; icon: ReactNode; checks: TrustCheck[] }) {
  const passed = checks.filter((check) => check.status === "passed").length;
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.75 }}>
        {icon}
        <Typography sx={{ fontWeight: 700, fontSize: "0.82rem" }}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {passed}/{checks.length} passed
        </Typography>
      </Stack>
      <Stack spacing={0.4}>
        {checks.map((check) => (
          <Tooltip key={check.id} title={check.detail} placement="top-start" disableInteractive>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
              <StatusIcon status={check.status} />
              <Typography
                variant="body2"
                noWrap
                sx={{ fontSize: "0.78rem", color: check.status === "failed" ? "#9b2c2c" : "text.primary", fontWeight: check.status === "failed" ? 700 : 400 }}
              >
                {check.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: "0.68rem" }}>
                {sourceLabel(check)}
              </Typography>
            </Stack>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
}

function FixResult({ result }: { result: TrustFixResult }) {
  const [openDiff, setOpenDiff] = useState<string | null>(null);
  const before = result.before;
  const after = result.after;
  return (
    <Box sx={{ mt: 1.25, border: "1px solid #b7e1c6", borderRadius: "12px", bgcolor: "#f5fbf7", p: 1.5 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
        <ScoreRing score={before.score} tone={STATUS_TONE[before.status].ring} size={36} />
        <Typography sx={{ fontWeight: 800, color: "text.secondary" }}>→</Typography>
        <ScoreRing score={after.score} tone={STATUS_TONE[after.status].ring} size={36} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
            {result.kept
              ? `Fixed and published as v${result.version?.versionNumber ?? after.versionNumber}`
              : "No change was kept"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Grade {before.grade} → {after.grade}. Re-checked with {after.tests.total} tests and {after.security.total} security checks
            {after.testRunner.durationMs ? ` (tests ran in ${(after.testRunner.durationMs / 1000).toFixed(1)}s)` : ""}. Logged in the
            vulnerability ledger.
          </Typography>
        </Box>
      </Stack>
      <Stack spacing={0.75} sx={{ mt: 1.25 }}>
        {result.changes.map((change) => (
          <Stack key={change.checkId} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#2e9e5b", mt: 0.25 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                {change.name}{" "}
                <Chip
                  size="small"
                  label={change.how === "codemod" ? "codemod" : `Editor Agent${result.editor?.model ? ` · ${result.editor.model}` : ""}`}
                  sx={{ height: 18, fontSize: "0.64rem", ml: 0.5 }}
                />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {change.summary} {change.files.join(", ")}
              </Typography>
            </Box>
          </Stack>
        ))}
        {result.unresolved.map((item) => (
          <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <ErrorRoundedIcon sx={{ fontSize: 16, color: "#c62828", mt: 0.25 }} />
            <Typography variant="caption" sx={{ color: "#9b2c2c" }}>
              Still failing: {item.name}. {item.detail}
            </Typography>
          </Stack>
        ))}
        {result.editor?.error ? (
          <Typography variant="caption" sx={{ color: "#9b2c2c" }}>
            Editor Agent: {result.editor.error}
          </Typography>
        ) : null}
      </Stack>
      {result.diffs.length ? (
        <Box sx={{ mt: 1.25 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
            Changed files
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75, mt: 0.5 }}>
            {result.diffs.map((diff) => (
              <Chip
                key={diff.path}
                size="small"
                variant={openDiff === diff.path ? "filled" : "outlined"}
                label={`${diff.status === "deleted" ? "− " : diff.status === "added" ? "+ " : ""}${diff.path}`}
                onClick={() => setOpenDiff(openDiff === diff.path ? null : diff.path)}
                sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.68rem" }}
              />
            ))}
          </Stack>
          {result.diffs
            .filter((diff) => diff.path === openDiff)
            .map((diff) => (
              <Box
                key={diff.path}
                component="pre"
                sx={{
                  mt: 0.75,
                  mb: 0,
                  p: 1,
                  borderRadius: "8px",
                  bgcolor: "#1d1f24",
                  color: "#e6edf3",
                  fontSize: "0.7rem",
                  overflowX: "auto",
                  maxHeight: 280,
                }}
              >
                {diff.diff.split("\n").map((line, index) => (
                  <Box
                    key={index}
                    component="span"
                    sx={{
                      display: "block",
                      color: line.startsWith("+") && !line.startsWith("+++") ? "#7ee2a8" : line.startsWith("-") && !line.startsWith("---") ? "#ffa198" : line.startsWith("@@") ? "#79c0ff" : undefined,
                    }}
                  >
                    {line || " "}
                  </Box>
                ))}
              </Box>
            ))}
        </Box>
      ) : null}
    </Box>
  );
}

export function TrustCard({ toolId, onChanged }: Props) {
  const [report, setReport] = useState<TrustReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<TrustFixResult | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTrustReport(toolId)
      .then((next) => !cancelled && setReport(next))
      .catch((reason: unknown) => !cancelled && setError(reason instanceof Error ? reason.message : "Trust check failed"));
    return () => {
      cancelled = true;
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [toolId]);

  async function fixAll() {
    setFixing(true);
    setResult(null);
    setError(null);
    setOpen(true);
    setStep(0);
    timer.current = window.setInterval(() => setStep((current) => Math.min(current + 1, FIX_STEPS.length - 1)), 1600);
    try {
      const next = await fixTrustReport(toolId);
      setResult(next);
      setReport(next.after);
      onChanged?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Fix failed");
    } finally {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
      setFixing(false);
    }
  }

  async function restore() {
    setRestoring(true);
    setResult(null);
    setError(null);
    try {
      setReport(await restoreTrustReport(toolId));
      onChanged?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Restore failed");
    } finally {
      setRestoring(false);
    }
  }

  if (!report) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.25, color: "text.secondary" }}>
        {error ? (
          <Typography variant="caption" color="error">
            Trust card unavailable: {error.slice(0, 120)}
          </Typography>
        ) : (
          <>
            <CircularProgress size={14} />
            <Typography variant="caption">Running tests and security checks…</Typography>
          </>
        )}
      </Stack>
    );
  }

  const tone = STATUS_TONE[report.status];
  const failed = report.checks.filter((check) => check.status === "failed");
  const security = report.checks.filter((check) => check.kind === "security");
  const functional = report.checks.filter((check) => check.kind === "functional");
  const vulnTotal = report.vulnerabilities.critical + report.vulnerabilities.high + report.vulnerabilities.medium + report.vulnerabilities.low;

  return (
    <Box sx={{ mt: 1.5, border: "1px solid", borderColor: failed.length ? "#f2c4be" : "#cfe9d8", borderRadius: "14px", overflow: "hidden" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ px: 1.5, py: 1.25, bgcolor: tone.bg, alignItems: { md: "center" } }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
          <ScoreRing score={report.score} tone={tone.ring} />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: tone.color }}>
                Trust card · {tone.label} · Grade {report.grade}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                v{report.versionNumber}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
              {report.headline}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 0.25, flexWrap: "wrap" }}>
              <Typography variant="caption" sx={{ color: report.tests.failed ? "#9b2c2c" : "text.secondary", fontWeight: 600 }}>
                Tests {report.tests.passed}/{report.tests.total - report.tests.skipped} passed
              </Typography>
              <Typography variant="caption" sx={{ color: report.security.failed ? "#9b2c2c" : "text.secondary", fontWeight: 600 }}>
                Security {report.security.passed}/{report.security.total} passed
              </Typography>
              <Typography variant="caption" sx={{ color: vulnTotal ? "#9b2c2c" : "text.secondary", fontWeight: 600 }}>
                {vulnTotal
                  ? `${report.vulnerabilities.critical} critical · ${report.vulnerabilities.high} high · ${report.vulnerabilities.medium} medium`
                  : "No vulnerabilities"}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
          {failed.length && report.canFix ? (
            <Button
              size="small"
              variant="contained"
              color={report.status === "unsafe" ? "error" : "warning"}
              disabled={fixing}
              startIcon={fixing ? <CircularProgress size={14} color="inherit" /> : <AutoFixHighRoundedIcon />}
              onClick={() => void fixAll()}
              sx={{ borderRadius: "10px", whiteSpace: "nowrap" }}
            >
              {fixing ? "Fixing…" : `Fix all ${failed.length} with Terrarium`}
            </Button>
          ) : null}
          {report.demo && report.canFix && !failed.length && report.versionNumber > 1 ? (
            <Button
              size="small"
              variant="text"
              disabled={restoring}
              startIcon={<RestartAltRoundedIcon />}
              onClick={() => void restore()}
              sx={{ borderRadius: "10px", whiteSpace: "nowrap" }}
            >
              Restore original
            </Button>
          ) : null}
          <Button
            size="small"
            variant="outlined"
            endIcon={<ExpandMoreRoundedIcon sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}
            onClick={() => setOpen((current) => !current)}
            sx={{ borderRadius: "10px", whiteSpace: "nowrap", bgcolor: "#fff" }}
          >
            Details
          </Button>
        </Stack>
      </Stack>
      {fixing ? (
        <Box sx={{ px: 1.5, py: 1, bgcolor: "#fff", borderTop: "1px solid #eee" }}>
          <LinearProgress sx={{ borderRadius: 4, mb: 0.75 }} />
          <Typography variant="caption" color="text.secondary">
            {FIX_STEPS[step]}…
          </Typography>
        </Box>
      ) : null}
      <Collapse in={open} unmountOnExit>
        <Box sx={{ p: 1.5, bgcolor: "#fff", borderTop: "1px solid #eee" }}>
          {result ? <FixResult result={result} /> : null}
          {error ? (
            <Typography variant="caption" color="error" sx={{ display: "block", mb: 1 }}>
              {error.slice(0, 300)}
            </Typography>
          ) : null}
          {failed.length ? (
            <Box sx={{ mb: 1.75, mt: result ? 1.5 : 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mb: 0.75, color: "#9b2c2c" }}>
                What is breaking trust ({failed.length})
              </Typography>
              <Stack spacing={1}>
                {failed.map((check) => (
                  <Vulnerability key={check.id} check={check} />
                ))}
              </Stack>
            </Box>
          ) : null}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
            <CheckList title="Functional tests" icon={<BugReportOutlinedIcon sx={{ fontSize: 16 }} />} checks={functional} />
            <CheckList title="Security tests" icon={<ShieldOutlinedIcon sx={{ fontSize: 16 }} />} checks={security} />
          </Stack>
          {report.rootProblems.length ? (
            <Box sx={{ mt: 1.75 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", mb: 0.75 }}>Root problems this card checks</Typography>
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
                {report.rootProblems.map((root) => (
                  <Tooltip key={root.id} title={root.detail}>
                    <Chip
                      size="small"
                      icon={root.status === "failing" ? <ErrorRoundedIcon /> : <CheckCircleRoundedIcon />}
                      label={root.title}
                      sx={{
                        fontSize: "0.7rem",
                        bgcolor: root.status === "failing" ? "#fde8e6" : "#e7f6ee",
                        color: root.status === "failing" ? "#9b2c2c" : "#1f6b3e",
                        "& .MuiChip-icon": { color: "inherit", fontSize: 15 },
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          ) : null}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            Score starts at 100: critical −35, high −20, medium −8, low −3 per failing security check, −10 per failing test.{" "}
            {report.testRunner.status === "ran"
              ? `Tests: ${report.testRunner.files.length} file(s), ${report.testRunner.detail}, ${(report.testRunner.durationMs / 1000).toFixed(1)}s.`
              : report.testRunner.detail}{" "}
            Checked {new Date(report.checkedAt).toLocaleTimeString()}.
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
