import type { FormEvent } from "react";
import { Alert, IconButton, InputBase, Paper, Typography } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

type PromptFormProps = {
  prompt: string;
  busy: boolean;
  status: string | null;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PromptForm({ prompt, busy, status, onPromptChange, onSubmit }: PromptFormProps) {
  const canSend = prompt.trim().length > 0 && !busy;

  return (
    <form onSubmit={onSubmit} style={{ padding: "8px 12px 12px" }}>
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minHeight: 44,
          px: 1.25,
          py: 0.25,
          border: 1,
          borderColor: "divider",
          borderRadius: 999,
          bgcolor: "background.paper",
        }}
      >
        <InputBase
          id="prompt"
          multiline
          minRows={1}
          maxRows={4}
          fullWidth
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Message Terrarium…"
          sx={{ px: 0.5, py: 0.5, fontSize: 14, lineHeight: 1.4 }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={!canSend}
          aria-label="Send"
          size="small"
          sx={{
            bgcolor: canSend ? "primary.main" : "action.hover",
            color: canSend ? "primary.contrastText" : "text.disabled",
            "&:hover": { bgcolor: canSend ? "primary.dark" : "action.hover" },
          }}
        >
          <SendRoundedIcon fontSize="small" />
        </IconButton>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75, px: 0.5 }}>
        Enter to send · Shift+Enter for a new line
      </Typography>
      {status ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {status}
        </Alert>
      ) : null}
    </form>
  );
}
