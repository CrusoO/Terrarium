import { useEffect, useState } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Collapse, Stack, Typography } from "@mui/material";
import type { SessionEvent } from "@terrarium/contracts";

const LABELS: Record<string, string> = {
  "session.created": "Session started",
  "smartmatch.hit": "✓ Found matching template",
  "smartmatch.miss": "→ Building from scratch",
  "intent.classified": "✓ Understood your request",
  "codegen.started": "⚡ Generating code...",
  "codegen.completed": "✓ Code generated",
  "editor.started": "✏️ Editing files...",
  "editor.completed": "✓ Files updated",
  "sandbox.booting": "🚀 Starting preview...",
  "sandbox.ready": "✓ Preview ready",
  "sandbox.unhealthy": "⚠️ Preview failed",
  "heal.attempt": "🔄 Retrying...",
  "heal.exhausted": "❌ Max retries reached",
  "preview.stream.started": "Live preview started",
  "preview.stream.file": "Streaming file into preview",
  "preview.stream.completed": "Live preview assembled",
  "preview.ready": "✅ Live preview ready",
};

function eventLabel(event: SessionEvent): string {
  return LABELS[event.name] ?? event.name;
}

function eventDetail(event: SessionEvent): string | null {
  const payload = event.payload;
  if (!payload) return null;
  const model =
    typeof payload.llmProvider === "string" && typeof payload.llmModel === "string"
      ? `Model: ${payload.llmProvider}/${payload.llmModel}`
      : "";
  const reason = typeof payload.llmReason === "string" && payload.llmReason.trim()
    ? `Reason: ${payload.llmReason.trim()}`
    : "";
  const modelDetail = [model, reason].filter(Boolean).join("\n");
  if (typeof payload.logs === "string" && payload.logs.trim()) {
    return [payload.logs.trim(), modelDetail].filter(Boolean).join("\n\n");
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return [payload.message.trim(), modelDetail].filter(Boolean).join("\n\n");
  }
  return modelDetail || null;
}

function isSettled(events: SessionEvent[]): boolean {
  const last = events[events.length - 1];
  return last?.name === "preview.ready" || last?.name === "sandbox.unhealthy";
}

export function AgentTrace({ events, live }: { events: SessionEvent[]; live: boolean }) {
  const settled = isSettled(events);
  const collapsedDefault = settled && events.length > 3 && !live;
  const [open, setOpen] = useState(!collapsedDefault);

  useEffect(() => {
    if (!collapsedDefault) {
      setOpen(true);
    }
  }, [collapsedDefault, events.length]);

  if (events.length === 0) {
    return null;
  }

  const last = events[events.length - 1];
  const title = live && !settled 
    ? eventLabel(last) 
    : settled 
    ? `✅ Build complete (${events.length} steps)` 
    : eventLabel(last);

  return (
    <Box className="agent-trace" sx={{ minWidth: 0, flex: 1 }}>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((current) => !current)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: "100%",
          m: 0,
          p: 0,
          border: 0,
          bgcolor: "transparent",
          cursor: "pointer",
          textAlign: "left",
          color: "text.primary",
          "&:hover": {
            "& .expand-icon": {
              bgcolor: "action.hover"
            }
          }
        }}
      >
        {live && !settled ? (
          <span className="agent-step-pulse" aria-hidden="true" />
        ) : (
          <CheckCircleRoundedIcon 
            sx={{ 
              fontSize: 18, 
              color: settled ? "success.main" : "primary.main",
              flexShrink: 0
            }} 
          />
        )}
        <Typography
          variant="body2"
          className={live && !settled ? "thinking-shimmer" : undefined}
          sx={{ fontWeight: 600, flex: 1, fontSize: "0.9rem" }}
        >
          {title}
        </Typography>
        <Box
          className="expand-icon"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "50%",
            transition: "all 0.2s",
          }}
        >
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 20,
              color: "text.secondary",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>
      </Box>
      <Collapse in={open}>
        <Stack component="ol" spacing={1} sx={{ m: 0, mt: 1.5, pl: 0, listStyle: "none" }}>
          {events.map((event, index) => {
            const active = live && !settled && index === events.length - 1;
            const detail = eventDetail(event);
            return (
              <Stack
                component="li"
                key={`${event.sessionId}-${event.at}-${event.name}-${index}`}
                className="agent-step-row"
                direction="row"
                spacing={1.25}
                sx={{ alignItems: "flex-start" }}
              >
                <Box
                  sx={{
                    width: 16,
                    display: "flex",
                    justifyContent: "center",
                    pt: "2px",
                    flexShrink: 0,
                  }}
                >
                  {active ? (
                    <span className="agent-step-pulse" aria-hidden="true" />
                  ) : (
                    <CheckCircleRoundedIcon 
                      sx={{ 
                        fontSize: 14, 
                        color: "success.main",
                        opacity: 0.6
                      }} 
                    />
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1, pb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: active ? 600 : 500,
                      fontSize: "0.875rem",
                      lineHeight: 1.5,
                      color: active ? "primary.main" : "text.primary"
                    }}
                  >
                    {eventLabel(event)}
                  </Typography>
                  {detail ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ 
                        display: "block", 
                        mt: 0.5, 
                        whiteSpace: "pre-wrap", 
                        wordBreak: "break-word",
                        fontSize: "0.75rem",
                        lineHeight: 1.5,
                        fontFamily: "var(--font-mono)",
                        bgcolor: "#f8fafc",
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 1.5,
                        border: 1,
                        borderColor: "divider"
                      }}
                    >
                      {detail}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Collapse>
    </Box>
  );
}
