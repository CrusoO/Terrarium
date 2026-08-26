import { useState } from "react";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { SessionEvent } from "@terrarium/contracts";
import { IntentResult } from "../chat/IntentResult";

export function EventLogButton({ events }: { events: SessionEvent[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Badge
        badgeContent={events.length || undefined}
        color="primary"
        max={99}
        overlap="rectangular"
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<TimelineRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={() => setOpen(true)}
          sx={{
            textTransform: "none",
            fontSize: 12,
            fontWeight: 600,
            px: 1.25,
            py: 0.25,
            minHeight: 28,
            borderColor: "divider",
            color: "text.secondary",
          }}
        >
          What is happening
        </Button>
      </Badge>
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
        events.map((item, index) => (
          <Box
            component="li"
            key={`${item.sessionId}-${item.at}-${item.name}-${index}`}
            sx={{
              listStyle: "none",
              borderRadius: 1.5,
              px: 1.5,
              py: 1.25,
              bgcolor: "#f4e8ec",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 12,
            }}
          >
            <Typography component="span" sx={{ fontWeight: 700, color: "primary.main", fontSize: 12 }}>
              {item.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 11 }}>
              {item.at}
            </Typography>
            {item.name === "intent.classified" ? <IntentResult event={item} /> : null}
            {item.name === "preview.ready" && typeof item.payload?.previewUrl === "string" ? (
              <Typography sx={{ mt: 1, fontSize: 11, wordBreak: "break-all" }} color="text.secondary">
                {item.payload.previewUrl}
              </Typography>
            ) : null}
          </Box>
        ))
      )}
    </Box>
  );
}
