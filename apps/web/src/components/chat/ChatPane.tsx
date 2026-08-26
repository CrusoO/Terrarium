import { useEffect, useRef, type FormEvent } from "react";
import { Avatar, Box, Chip, Paper, Stack, Typography } from "@mui/material";
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
};

export function ChatPane({
  chat,
  prompt,
  busy,
  status,
  onPromptChange,
  onSubmit,
  onSendChoice,
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
        spacing={1.5}
        sx={{
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: 15, fontWeight: 700 }}>T</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Terrarium
            </Typography>
            <Chip label="Live" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap>
            Describe a tool. I’ll ask a few questions, then preview it.
          </Typography>
        </Box>
      </Stack>
      <Box ref={scrollerRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 1.5, py: 2 }}>
        {chat.length === 0 ? (
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 28, height: 28, fontSize: 12, fontWeight: 700 }}>
              T
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                Terrarium
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 3,
                  bgcolor: "background.paper",
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  Hey — what should we build?
                </Typography>
              </Paper>
            </Box>
          </Stack>
        ) : (
          <ChatThread chat={chat} busy={busy} onSendChoice={onSendChoice} />
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
