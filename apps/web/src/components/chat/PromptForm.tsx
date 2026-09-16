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
        py: 2.25,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(14px)",
      }}
    >
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
            minHeight: 54,
            px: 2,
            py: 1.15,
            border: 1,
            borderColor: canSend ? "primary.main" : "divider",
            borderRadius: 2.5,
            bgcolor: "background.paper",
            boxShadow: "0 14px 34px rgba(17, 24, 39, 0.08)",
            transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
            "&:focus-within": {
              borderColor: "primary.main",
              boxShadow: "0 0 0 4px rgba(110, 20, 41, 0.08), 0 16px 38px rgba(17, 24, 39, 0.1)",
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
            placeholder="Describe the app you want to build..."
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
                transform: canSend ? "translateY(-1px)" : "none",
              },
              transition: "all 0.2s",
              boxShadow: canSend ? "0 10px 22px rgba(110, 20, 41, 0.22)" : "none",
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
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1.5 }}>
            {status}
          </Alert>
        ) : null}
      </Box>
    </Box>
  );
}
