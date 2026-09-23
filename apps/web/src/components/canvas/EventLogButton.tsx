import { useState } from "react";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { SessionEvent } from "@terrarium/contracts";
import { eventDetail, eventLabel } from "../chat/AgentTrace";
import { IntentResult } from "../chat/IntentResult";

export function EventLogButton({ events }: { events: SessionEvent[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="What is happening">
        <IconButton
          aria-label="What is happening"
          onClick={() => setOpen(true)}
          sx={{
            position: "relative",
            width: 32,
            height: 32,
            borderRadius: "8px",
            color: "text.secondary",
            "&:hover": { bgcolor: "#f6f3ee" },
          }}
        >
          <TimelineRoundedIcon sx={{ fontSize: 18 }} />
          {events.length > 0 ? (
            <Box
              component="span"
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 14,
                height: 14,
                px: 0.25,
                borderRadius: "999px",
                bgcolor: "#eceae6",
                color: "text.secondary",
                fontSize: "0.6rem",
                fontWeight: 700,
                lineHeight: "14px",
              }}
            >
              {events.length > 99 ? "99" : events.length}
            </Box>
          ) : null}
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", pr: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
            What is happening
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            {events.length} event{events.length === 1 ? "" : "s"}
          </Typography>
          <IconButton aria-label="Close event log" onClick={() => setOpen(false)} size="small">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <EventList events={events} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EventList({ events }: { events: SessionEvent[] }) {
  return (
    <Box component="ol" sx={{ m: 0, p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      {events.length === 0 ? (
        <Typography component="li" variant="body2" color="text.secondary" sx={{ listStyle: "none" }}>
          No SessionEvents yet. Submit a prompt to start the SSE stream.
        </Typography>
      ) : (
        events.map((item, index) => {
          const detail = eventDetail(item);
          return (
          <Box
            component="li"
            key={`${item.sessionId}-${item.at}-${item.name}-${index}`}
            sx={{
              listStyle: "none",
              borderRadius: 1.5,
              px: 1.5,
              py: 1.25,
              bgcolor: "#f4e8ec",
            }}
          >
            <Typography component="span" sx={{ fontWeight: 700, color: "primary.main", fontSize: 13 }}>
              {eventLabel(item)}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.35, fontSize: 11 }}>
              {item.at}
            </Typography>
            {item.name === "intent.classified" ? <IntentResult event={item} /> : null}
            {detail ? (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: 12,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "text.primary",
                }}
              >
                {detail}
              </Typography>
            ) : null}
            {item.name === "preview.ready" && typeof item.payload?.previewUrl === "string" ? (
              <Typography sx={{ mt: 1, fontSize: 11, wordBreak: "break-all" }} color="text.secondary">
                {item.payload.previewUrl}
              </Typography>
            ) : null}
          </Box>
          );
        })
      )}
    </Box>
  );
}
