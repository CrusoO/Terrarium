import { useState } from "react";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { Box, Button, Collapse, Stack, Typography } from "@mui/material";

type ErrorDetailsButtonProps = {
  title?: string;
  details: string;
  helper?: string;
  busy?: boolean;
  onRetry?: () => void;
};

export function ErrorDetailsButton({
  title = "Error details",
  details,
  helper = "Terrarium will self-heal when possible. Copy these details if you want to paste them back with extra instructions.",
  busy = false,
  onRetry,
}: ErrorDetailsButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const preview = (details || "No details available.").split("\n").find(Boolean) || "No details available.";

  async function copyDetails() {
    await navigator.clipboard.writeText(details || "No details available.").catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "rgba(217,48,37,0.18)",
        borderRadius: 1.5,
        bgcolor: "rgba(252,232,230,0.42)",
        overflow: "hidden",
      }}
    >
      <Button
        type="button"
        fullWidth
        onClick={() => setOpen((current) => !current)}
        startIcon={<ErrorOutlineRoundedIcon sx={{ fontSize: 17 }} />}
        sx={{
          justifyContent: "flex-start",
          px: 1.25,
          py: 0.9,
          color: "error.dark",
          textTransform: "none",
          borderRadius: 0,
          fontWeight: 650,
        }}
      >
        <Stack sx={{ minWidth: 0, alignItems: "flex-start" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "error.dark" }}>
            {title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-mono)",
            }}
          >
            {preview}
          </Typography>
        </Stack>
      </Button>
      <Collapse in={open}>
        <Stack spacing={1} sx={{ px: 1.25, pb: 1.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {helper}
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1,
              maxHeight: 150,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: "0.72rem",
              fontFamily: "var(--font-mono)",
              color: "text.secondary",
              bgcolor: "rgba(255,255,255,0.72)",
              border: 1,
              borderColor: "rgba(17,24,39,0.08)",
              borderRadius: 1,
            }}
          >
            {details || "No details available."}
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button size="small" variant="outlined" onClick={copyDetails} startIcon={<ContentCopyRoundedIcon />}>
              {copied ? "Copied" : "Copy"}
            </Button>
            {onRetry ? (
              <Button size="small" variant="contained" color="error" disabled={busy} onClick={onRetry}>
                Retry
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Collapse>
    </Box>
  );
}
