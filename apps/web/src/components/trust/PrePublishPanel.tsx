import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { CheckStep, ToolHealth } from "@terrarium/contracts";
import { useEffect, useState } from "react";

const STEPS: CheckStep[] = ["tests", "regression", "dependencies", "code", "secrets", "image", "attacks"];

type Props = {
  open: boolean;
  onClose: () => void;
  health: ToolHealth | null;
  stepStatus: Partial<Record<CheckStep, "running" | "passed" | "failed" | "skipped">>;
  onPublish: (ackWarnings: boolean) => void;
  onFixAutomatically: () => void;
  publishing?: boolean;
  checking?: boolean;
};

export function PrePublishPanel({
  open,
  onClose,
  health,
  stepStatus,
  onPublish,
  onFixAutomatically,
  publishing,
  checking,
}: Props) {
  const [ack, setAck] = useState(false);
  useEffect(() => {
    if (!open) {
      setAck(false);
    }
  }, [open]);
  const blocked = health?.status === "unsafe";
  const warn = health?.status === "warning";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Publish check</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {checking && !health ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Running publish checks…
              </Typography>
              <LinearProgress sx={{ mt: 1 }} />
            </Box>
          ) : null}
          {STEPS.map((step) => (
            <Box key={step}>
              <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                {step.replace("_", " ")}{" "}
                {stepStatus[step] ? `— ${stepStatus[step]}` : ""}
              </Typography>
              {stepStatus[step] === "running" ? <LinearProgress sx={{ mt: 0.5 }} /> : null}
            </Box>
          ))}
          {health ? (
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">
                Tests {health.tests.passed} / {health.tests.total} passed
              </Typography>
              <Typography variant="body2">
                Attacks {health.attacks.succeeded} of {health.attacks.attempted} worked
              </Typography>
              <Typography variant="body2">
                Packages {health.vulnerabilities.high + health.vulnerabilities.critical} high
              </Typography>
            </Stack>
          ) : null}
          {blocked ? (
            <Alert severity="error">
              Publishing is blocked until high issues are fixed
              <Box sx={{ mt: 1 }}>
                <Button size="small" variant="outlined" onClick={onFixAutomatically}>
                  Fix automatically
                </Button>
              </Box>
            </Alert>
          ) : null}
          {warn ? (
            <FormControlLabel
              control={<Checkbox checked={ack} onChange={(e) => setAck(e.target.checked)} />}
              label="I've reviewed the warnings"
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          disabled={blocked || publishing || checking || (warn && !ack) || !health}
          onClick={() => onPublish(!warn || ack)}
        >
          Publish
        </Button>
      </DialogActions>
    </Dialog>
  );
}
