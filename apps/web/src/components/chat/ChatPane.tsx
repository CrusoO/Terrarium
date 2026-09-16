import { useEffect, useRef, type FormEvent } from "react";
import { Avatar, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import type { ChatItem } from "../../types/chat";
import { ChatThread } from "./ChatThread";
import { PromptForm } from "./PromptForm";

type ChatPaneProps = {
  chat: ChatItem[];
  prompt: string;
  busy: boolean;
  status: string | null;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSendChoice: (text: string) => void;
  onRetryAnyway?: () => void;
};

export function ChatPane({
  chat,
  prompt,
  busy,
  status,
  onPromptChange,
  onSubmit,
  onSendChoice,
  onRetryAnyway,
}: ChatPaneProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [chat]);

  return (
    <Box
      component="aside"
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        flex: 1,
        bgcolor: "background.default",
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Avatar 
          sx={{ 
            bgcolor: "primary.main", 
            width: 40, 
            height: 40,
            boxShadow: "0 2px 8px rgba(26, 115, 232, 0.2)"
          }}
        >
          <AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.25 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: "1.1rem" }}>
              Terrarium
            </Typography>
            <Chip 
              label="AI Builder" 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ 
                height: 22, 
                fontSize: "0.7rem",
                fontWeight: 600,
                borderRadius: "4px"
              }} 
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
            Describe an app. I'll build it step by step with a live preview.
          </Typography>
        </Box>
      </Stack>
      <Box ref={scrollerRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2, py: 3 }}>
        {chat.length === 0 ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", maxWidth: 720, mx: "auto" }}>
            <Avatar 
              sx={{ 
                bgcolor: "primary.main", 
                width: 32, 
                height: 32,
                boxShadow: "0 1px 4px rgba(26, 115, 232, 0.15)"
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.75, color: "text.secondary" }}>
                Terrarium Assistant
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.7, color: "text.primary" }}>
                  👋 Hey there! What kind of app should we build today?
                </Typography>
              </Paper>
            </Box>
          </Stack>
        ) : (
          <Box sx={{ maxWidth: 720, mx: "auto" }}>
            <ChatThread
              chat={chat}
              busy={busy}
              onSendChoice={onSendChoice}
              onRetryAnyway={onRetryAnyway}
            />
          </Box>
        )}
      </Box>
      <PromptForm
        prompt={prompt}
        busy={busy}
        status={status}
        onPromptChange={onPromptChange}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
