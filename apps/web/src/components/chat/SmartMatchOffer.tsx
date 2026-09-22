import { useState } from "react";
import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import type { SessionEvent, SmartMatchResult, ToolSummary } from "@terrarium/contracts";

type SmartMatchOfferProps = {
  event: SessionEvent;
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
};

/**
 * P5-S3: Smart Match offer UI
 * 
 * Shows when smartmatch.hit fires, letting user choose "Use existing" or "Build new".
 * Never auto-overwrites intent.
 */
export function SmartMatchOffer({ event, onAccept, onReject, disabled }: SmartMatchOfferProps) {
  const [chosen, setChosen] = useState<"accept" | "reject" | null>(null);
  
  // Extract match result from event payload
  const payload = event.payload as SmartMatchResult | undefined;
  const tool = payload?.matchedTool as ToolSummary | undefined;
  
  if (!tool) {
    return null;
  }

  const handleAccept = () => {
    setChosen("accept");
    onAccept();
  };

  const handleReject = () => {
    setChosen("reject");
    onReject();
  };

  const score = payload?.score ? Math.round(payload.score * 100) : 100;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: 2,
        borderColor: chosen ? "success.main" : "primary.main",
        borderRadius: 2.5,
        bgcolor: chosen ? "rgba(46, 125, 50, 0.08)" : "rgba(110,20,41,0.08)",
        backdropFilter: "blur(18px)",
        boxShadow: chosen ? "0 16px 34px rgba(46, 125, 50, 0.18)" : "0 16px 34px rgba(110, 20, 41, 0.18)",
        transition: "all 0.3s ease",
      }}
    >
      <Stack spacing={2.5}>
        {/* Header */}
        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
          <Avatar
            sx={{
              bgcolor: chosen ? "success.main" : "primary.main",
              width: 48,
              height: 48,
              boxShadow: "0 12px 24px rgba(110, 20, 41, 0.24)",
            }}
          >
            {chosen === "accept" ? (
              <CheckCircleRoundedIcon sx={{ fontSize: 24 }} />
            ) : (
              <RocketLaunchRoundedIcon sx={{ fontSize: 24 }} />
            )}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {chosen ? "✓ Choice confirmed" : "🎯 Exact match found"}
              </Typography>
              <Chip
                label={`${score}% match`}
                size="small"
                color={chosen ? "success" : "primary"}
                sx={{
                  height: 22,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {chosen === "accept"
                ? "Loading the existing tool..."
                : chosen === "reject"
                ? "Building from scratch..."
                : "I found an existing tool that matches your request. Would you like to use it?"}
            </Typography>
          </Box>
        </Stack>

        {/* Tool info */}
        {!chosen && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "rgba(255,255,255,0.82)",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75, fontSize: "0.9rem" }}>
              {tool.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
              {tool.summary}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {tool.fileCount || 0} files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date(tool.updatedAt).toLocaleDateString()}
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Action buttons */}
        {!chosen && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={disabled}
              onClick={handleAccept}
              startIcon={<CheckCircleRoundedIcon />}
              sx={{
                py: 1.5,
                fontWeight: 700,
                fontSize: "0.95rem",
                textTransform: "none",
                borderRadius: 2,
                boxShadow: "0 12px 24px rgba(110, 20, 41, 0.24)",
                "&:hover": {
                  boxShadow: "0 16px 32px rgba(110, 20, 41, 0.32)",
                },
              }}
            >
              Use existing
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              fullWidth
              disabled={disabled}
              onClick={handleReject}
              startIcon={<BuildRoundedIcon />}
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: "0.95rem",
                textTransform: "none",
                borderRadius: 2,
                borderWidth: 2,
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderWidth: 2,
                  borderColor: "text.primary",
                  bgcolor: "rgba(0,0,0,0.04)",
                },
              }}
            >
              Build new
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
