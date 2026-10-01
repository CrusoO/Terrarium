import { useEffect, useRef, type FormEvent } from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
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
  onAcceptMatch?: (toolId: string) => void;
  onRejectMatch?: () => void;
  canEdit?: boolean;
  editRequestStatus?: "idle" | "pending" | "sent";
  onRequestEdit?: () => void;
  userName?: string;
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
  onAcceptMatch,
  onRejectMatch,
  canEdit = true,
  editRequestStatus = "idle",
  onRequestEdit,
  userName,
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
        borderRight: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          height: 56,
          px: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>
          Terrarium
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {userName ? (
            <Typography
              variant="body2"
              noWrap
              title={userName}
              sx={{ fontWeight: 600, color: "text.secondary", maxWidth: 160 }}
            >
              {userName}
            </Typography>
          ) : null}
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1f8a4c", flexShrink: 0 }} />
        </Box>
      </Box>
      <Box ref={scrollerRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2.5, py: 3 }}>
        {chat.length === 0 ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", maxWidth: 720, mx: "auto" }}>
            <Avatar
              sx={{
                bgcolor: "#efecea",
                color: "text.primary",
                width: 28,
                height: 28,
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1, pt: 0.35 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5, color: "text.primary" }}>
                Terra
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: "text.primary" }}>
                What kind of app should we build today?
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Box sx={{ maxWidth: 720, mx: "auto" }}>
            <ChatThread
              chat={chat}
              busy={busy}
              onSendChoice={onSendChoice}
              onRetryAnyway={onRetryAnyway}
              onAcceptMatch={onAcceptMatch}
              onRejectMatch={onRejectMatch}
            />
          </Box>
        )}
      </Box>
      <PromptForm
        prompt={prompt}
        busy={busy}
        status={status}
        disabled={!canEdit}
        disabledHint={
          canEdit
            ? undefined
            : editRequestStatus === "sent"
              ? "Edit request sent. You can keep using the app while the owner reviews it."
              : "You can use this app. Request edit access from the owner to change it."
        }
        actionLabel={canEdit ? undefined : editRequestStatus === "sent" ? "Requested" : "Request edit"}
        actionBusy={editRequestStatus === "pending"}
        onAction={canEdit ? undefined : onRequestEdit}
        onPromptChange={onPromptChange}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
