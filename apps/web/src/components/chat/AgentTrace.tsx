import { useEffect, useState } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Collapse, Stack, Typography } from "@mui/material";
import type { SessionEvent } from "@terrarium/contracts";

const LABELS: Record<string, string> = {
  "session.created": "Session started",
  "smartmatch.hit": "Found a match",
  "smartmatch.miss": "No library match",
  "intent.classified": "Intent classified",
  "codegen.started": "Generating code",
  "codegen.completed": "Code ready",
  "editor.started": "Editing files",
  "editor.completed": "Edit complete",
  "sandbox.booting": "Starting sandbox",
  "sandbox.ready": "Sandbox ready",
  "sandbox.unhealthy": "Sandbox failed",
  "heal.attempt": "heal.attempt",
  "heal.exhausted": "heal.exhausted",
  "preview.ready": "Preview ready",
};

function eventLabel(event: SessionEvent): string {
  return LABELS[event.name] ?? event.name;
}

function eventDetail(event: SessionEvent): string | null {
  const payload = event.payload;
  if (!payload) return null;
  if (typeof payload.logs === "string" && payload.logs.trim()) {
    return payload.logs.trim();
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  return null;
}

function isSettled(events: SessionEvent[]): boolean {
  const last = events[events.length - 1];
  return last?.name === "preview.ready" || last?.name === "sandbox.unhealthy";
}

export function AgentTrace({ events, live }: { events: SessionEvent[]; live: boolean }) {
  const settled = isSettled(events);
  const collapsedDefault = settled && events.length > 2 && !live;
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
  const title = live && !settled ? eventLabel(last) : settled ? "Done" : eventLabel(last);

  return (
    <Box className="agent-trace" sx={{ minWidth: 0, flex: 1 }}>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((current) => !current)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          width: "100%",
          m: 0,
          p: 0,
          border: 0,
          bgcolor: "transparent",
          cursor: "pointer",
          textAlign: "left",
          color: "text.primary",
        }}
      >
        {live && !settled ? (
          <span className="agent-step-pulse" aria-hidden="true" />
        ) : (
          <CheckRoundedIcon className="agent-step-check" sx={{ fontSize: 16, color: "success.main" }} />
        )}
        <Typography
          variant="body2"
          className={live && !settled ? "thinking-shimmer" : undefined}
          sx={{ fontWeight: 650, flex: 1 }}
        >
          {title}
        </Typography>
        <ExpandMoreRoundedIcon
          sx={{
            fontSize: 18,
            color: "text.secondary",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.16s ease",
          }}
        />
      </Box>
      <Collapse in={open}>
        <Stack component="ol" spacing={0.75} sx={{ m: 0, mt: 1.25, pl: 0.5, listStyle: "none" }}>
          {events.map((event, index) => {
            const active = live && !settled && index === events.length - 1;
            const detail = eventDetail(event);
            return (
              <Stack
                component="li"
                key={`${event.sessionId}-${event.at}-${event.name}-${index}`}
                className="agent-step-row"
                direction="row"
                spacing={1}
                sx={{ alignItems: "flex-start" }}
              >
                <Box
                  sx={{
                    width: 14,
                    display: "flex",
                    justifyContent: "center",
                    pt: "3px",
                    color: active ? "primary.main" : "success.main",
                  }}
                >
                  {active ? (
                    <span className="agent-step-pulse" aria-hidden="true" />
                  ) : (
                    <CheckRoundedIcon className="agent-step-check" sx={{ fontSize: 13 }} />
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: active ? 650 : 500 }}>
                    {eventLabel(event)}
                  </Typography>
                  {detail ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.25, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
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
