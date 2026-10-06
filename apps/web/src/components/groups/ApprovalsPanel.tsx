import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { Alert, Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { type AccessRequest } from "../../api/groups";

interface Props {
  pending: AccessRequest[];
  onApprove: (id: string) => Promise<void>;
  onDeny: (id: string) => Promise<void>;
}

export function ApprovalsPanel({ pending, onApprove, onDeny }: Props) {
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <NotificationsActiveIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>Edit requests</Typography>
        {pending.length > 0 && (
          <Chip label={pending.length} color="error" size="small" sx={{ fontWeight: 700 }} />
        )}
      </Stack>

      {pending.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          No pending access requests. You're all caught up!
        </Alert>
      ) : (
        <Stack spacing={1}>
          {pending.map((req) => (
            <Box key={req.id}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
                spacing={1} py={1.5}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>{req.requester_email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    wants to edit <strong>{req.tool_name || "your app"}</strong>
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" color="success"
                    startIcon={<CheckCircleIcon />} onClick={() => void onApprove(req.id)}>
                    Approve
                  </Button>
                  <Button size="small" variant="outlined" color="error"
                    startIcon={<CancelIcon />} onClick={() => void onDeny(req.id)}>
                    Deny
                  </Button>
                </Stack>
              </Stack>
              <Divider />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
