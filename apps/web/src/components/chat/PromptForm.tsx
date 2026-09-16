import type { FormEvent } from "react";
import { Alert, Box, IconButton, InputBase, Paper, Typography } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

type PromptFormProps = {
  prompt: string;
  busy: boolean;
  status: string | null;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PromptForm({
  prompt,
  busy,
  status,
  onPromptChange,
  onSubmit,
}: PromptFormProps) {
  const canSend = prompt.trim().length > 0 && !busy;

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        px: 2.5,
        py: 2,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Paper
          elevation={1}
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
            minHeight: 48,
            px: 2,
            py: 1,
            border: 1,
            borderColor: canSend ? "primary.main" : "divider",
            borderRadius: 3,
            bgcolor: "background.paper",
            transition: "border-color 0.2s, box-shadow 0.2s",
            "&:focus-within": {
              borderColor: "primary.main",
              boxShadow: "0 0 0 3px rgba(26, 115, 232, 0.1)",
            },
          }}
        >
          <InputBase
            id="prompt"
            multiline
            minRows={1}
            maxRows={5}
            fullWidth
            disabled={busy}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Describe your app... (e.g., 'build me a todo list')"
            sx={{
              fontSize: "0.95rem",
              lineHeight: 1.5,
              py: 0.5,
              "& textarea": {
                "&::placeholder": {
                  opacity: 0.6,
                },
              },
            }}
          />
          <IconButton
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            size="medium"
            sx={{
              bgcolor: canSend ? "primary.main" : "action.disabledBackground",
              color: canSend ? "primary.contrastText" : "text.disabled",
              width: 36,
              height: 36,
              "&:hover": {
                bgcolor: canSend ? "primary.dark" : "action.disabledBackground",
                transform: canSend ? "scale(1.05)" : "none",
              },
              transition: "all 0.2s",
              boxShadow: canSend ? "0 2px 8px rgba(26, 115, 232, 0.3)" : "none",
            }}
          >
            <SendRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Paper>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mt: 1,
            textAlign: "center",
            fontSize: "0.75rem",
          }}
        >
          <strong>Enter</strong> to send · <strong>Shift+Enter</strong> for new line
        </Typography>
        {status ? (
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
            {status}
          </Alert>
        ) : null}
      </Box>
    </Box>
  );
}
