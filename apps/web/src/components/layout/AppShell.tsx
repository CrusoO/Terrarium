import type { ReactNode } from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Box, Tooltip } from "@mui/material";
import { useSplitPanes } from "../../hooks/useSplitPanes";
import { IconRail } from "./IconRail";
import { SplitControlsContext } from "./SplitControls";

export function AppShell({ chat, canvas }: { chat: ReactNode; canvas: ReactNode }) {
  const split = useSplitPanes();
  const chatSize = split.desktop ? split.chatWidth : split.chatHeight;

  return (
    <SplitControlsContext.Provider
      value={{
        desktop: split.desktop,
        expandChat: split.expandChat,
        shrinkChat: split.shrinkChat,
        resetChat: split.resetChat,
        collapseChat: split.collapseChat,
      }}
    >
      <div ref={split.shellRef} className="flex h-full min-h-0 flex-col bg-white text-ink md:flex-row">
        <IconRail />
        {split.collapsed ? (
          <CollapsedChatStrip desktop={split.desktop} onRestore={split.restoreChat} />
        ) : (
          <Box
            sx={{
              width: { xs: "100%", md: chatSize },
              height: { xs: chatSize, md: "100%" },
              minWidth: 0,
              minHeight: 0,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {chat}
          </Box>
        )}
        {split.collapsed ? null : (
          <Box
            role="separator"
            aria-orientation={split.desktop ? "vertical" : "horizontal"}
            aria-label="Resize chat and preview"
            title="Drag to resize. Double-click to reset."
            onPointerDown={(event) => {
              event.preventDefault();
              split.onHandlePointerDown(event);
            }}
            onDoubleClick={split.resetChat}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: { xs: "100%", md: 8 },
              height: { xs: 8, md: "100%" },
              bgcolor: split.dragging ? "#f4e8ec" : "background.paper",
              borderRight: { md: 1 },
              borderBottom: { xs: 1, md: 0 },
              borderColor: "divider",
              cursor: split.desktop ? "col-resize" : "row-resize",
              touchAction: "none",
              zIndex: 2,
              "&:hover": { bgcolor: "#f4e8ec" },
              "&:hover .split-grip": { opacity: 1 },
            }}
          >
            <Box
              className="split-grip"
              sx={{
                width: { xs: 32, md: 3 },
                height: { xs: 3, md: 32 },
                borderRadius: 99,
                bgcolor: "primary.main",
                opacity: split.dragging ? 1 : 0.35,
              }}
            />
          </Box>
        )}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            pointerEvents: split.dragging ? "none" : "auto",
          }}
        >
          {canvas}
        </Box>
      </div>
    </SplitControlsContext.Provider>
  );
}

function CollapsedChatStrip({
  desktop,
  onRestore,
}: {
  desktop: boolean;
  onRestore: () => void;
}) {
  return (
    <Tooltip title="Show chat" placement={desktop ? "right" : "bottom"}>
      <Box
        component="button"
        type="button"
        onClick={onRestore}
        aria-label="Show chat"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: 0,
          borderRight: { md: 1 },
          borderBottom: { xs: 1, md: 0 },
          borderColor: "divider",
          bgcolor: "background.paper",
          color: "primary.main",
          cursor: "pointer",
          width: { xs: "100%", md: 40 },
          height: { xs: 40, md: "100%" },
          "&:hover": { bgcolor: "#f4e8ec" },
        }}
      >
        {desktop ? <ChevronRightRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
      </Box>
    </Tooltip>
  );
}
