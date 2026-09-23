import type { FormEvent } from "react";
import { Alert, Box, CircularProgress, IconButton, InputBase, Paper, Typography } from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
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
        pt: 0.5,
        pb: 1.75,
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            minHeight: 48,
            px: 1.5,
            py: 0.6,
            border: 1,
            borderColor: "divider",
            borderRadius: "14px",
            bgcolor: "background.paper",
            boxShadow: "none",
            "&:focus-within": {
              borderColor: "#d0cdc8",
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
          <ImageOutlinedIcon sx={{ fontSize: 18, color: "#b0aaa4", flexShrink: 0 }} />
          <IconButton
            type="submit"
            disabled={!canSend}
            aria-label={busy ? "Building" : "Send message"}
            size="medium"
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              width: 30,
              height: 30,
              flexShrink: 0,
              "&:hover": { bgcolor: "primary.dark" },
              "&.Mui-disabled": { bgcolor: "primary.main", color: "#fff" },
            }}
          >
            {busy ? (
              <CircularProgress size={14} thickness={5} sx={{ color: "#fff" }} />
            ) : (
              <SendRoundedIcon sx={{ fontSize: 16 }} />
            )}
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
          Enter to send · Shift+Enter for new line
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
