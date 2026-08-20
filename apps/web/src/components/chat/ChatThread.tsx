import { Avatar, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { ChatItem } from "../../types/chat";
import { ClarifyAnswers } from "./ClarifyAnswers";
import { ThinkingIndicator } from "./ThinkingIndicator";

type ChatThreadProps = {
  chat: ChatItem[];
  busy?: boolean;
  onSendChoice?: (text: string) => void;
};

function latestUnansweredAssistantId(chat: ChatItem[]): string | null {
  for (let index = chat.length - 1; index >= 0; index -= 1) {
    const item = chat[index];
    if (item.kind === "user" || item.kind === "thinking") {
      return null;
    }
    if (item.kind === "assistant" && item.questions && item.questions.length > 0) {
      return item.id;
    }
  }
  return null;
}

function PhaseMark({ phase }: { phase?: string }) {
  if (phase === "ready") {
    return <Chip label="Ready to build" size="small" color="success" variant="outlined" sx={{ height: 22 }} />;
  }
  if (phase === "clarify") {
    return <Chip label="A few details" size="small" color="primary" variant="outlined" sx={{ height: 22 }} />;
  }
  return null;
}

function UserBubble({ text }: { text: string }) {
  const blocks = parseAnswerBlocks(text);
  return (
    <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: "85%",
          px: 1.75,
          py: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: "18px 18px 6px 18px",
        }}
      >
        {blocks ? (
          <Stack spacing={1}>
            {blocks.map((block, index) => (
              <Box key={`${block.question}-${index}`}>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  {block.question}
                </Typography>
                <Typography variant="body2">{block.answer}</Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {text}
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}

function parseAnswerBlocks(text: string): { question: string; answer: string }[] | null {
  const chunks = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  if (chunks.length === 0) {
    return null;
  }
  const blocks = chunks.map((chunk) => {
    const match = chunk.match(/^\d+\.\s+(.+?)\n([\s\S]+)$/);
    if (!match) {
      return null;
    }
    return { question: match[1].trim(), answer: match[2].trim() };
  });
  if (blocks.some((block) => block === null)) {
    return null;
  }
  return blocks as { question: string; answer: string }[];
}

function TerrariumAvatar() {
  return (
    <Avatar sx={{ bgcolor: "primary.main", width: 28, height: 28, fontSize: 12, fontWeight: 700 }}>T</Avatar>
  );
}

export function ChatThread({ chat, busy = false, onSendChoice }: ChatThreadProps) {
  if (chat.length === 0) {
    return null;
  }

  const activeId = latestUnansweredAssistantId(chat);

  return (
    <Stack component="ol" spacing={2} sx={{ m: 0, p: 0, listStyle: "none" }}>
      {chat.map((item) => {
        if (item.kind === "user") {
          return (
            <Box component="li" key={item.id}>
              <UserBubble text={item.text} />
            </Box>
          );
        }
        if (item.kind === "thinking") {
          return (
            <Stack
              component="li"
              key={item.id}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "flex-start" }}
            >
              <TerrariumAvatar />
              <Paper elevation={0} sx={{ px: 1.5, py: 1, border: 1, borderColor: "divider", borderRadius: 3 }}>
                <ThinkingIndicator label={item.label} />
              </Paper>
            </Stack>
          );
        }
        if (item.kind === "assistant") {
          const active = item.id === activeId && !busy && Boolean(onSendChoice);
          return (
            <Stack
              component="li"
              key={item.id}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "flex-start" }}
            >
              <TerrariumAvatar />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Terrarium
                  </Typography>
                  <PhaseMark phase={item.phase} />
                </Stack>
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
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {item.text}
                  </Typography>
                </Paper>
                {item.questions && item.questions.length > 0 ? (
                  active ? (
                    <ClarifyAnswers questions={item.questions} onSend={(text) => onSendChoice?.(text)} />
                  ) : (
                    <Stack spacing={1} sx={{ mt: 1.5, opacity: 0.7 }}>
                      {item.questions.map((question, index) => (
                        <Paper key={`${item.id}-${index}`} variant="outlined" sx={{ px: 1.5, py: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {index + 1}. {question}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )
                ) : null}
              </Box>
            </Stack>
          );
        }
        return null;
      })}
    </Stack>
  );
}
