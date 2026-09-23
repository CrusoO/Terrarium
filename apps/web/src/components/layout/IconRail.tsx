import type { ReactNode } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ViewQuiltRoundedIcon from "@mui/icons-material/ViewQuiltRounded";
import { Avatar, Box, IconButton, Stack, Tooltip } from "@mui/material";

type IconRailProps = {
  view?: "chat" | "workspace";
  onViewChange?: (view: "chat" | "workspace") => void;
};

function RailButton({
  label,
  selected = false,
  onClick,
  children,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip title={label} placement="right">
      <IconButton
        aria-label={label}
        aria-current={selected ? "page" : undefined}
        onClick={onClick}
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.25,
          color: selected ? "primary.main" : "text.secondary",
          bgcolor: selected ? "#f6e8ec" : "transparent",
          "&:hover": { bgcolor: selected ? "#f3dde3" : "#f6f5f3" },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

export function IconRail({ view = "chat", onViewChange }: IconRailProps) {
  return (
    <Stack
      component="nav"
      sx={{
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        width: 64,
        height: "100%",
        py: 1.75,
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        flexShrink: 0,
      }}
    >
      <Avatar
        sx={{
          bgcolor: "primary.main",
          width: 32,
          height: 32,
          fontWeight: 700,
          fontSize: 14,
          mb: 2,
        }}
      >
        T
      </Avatar>
      <Stack spacing={0.5} sx={{ alignItems: "center" }}>
        <RailButton label="Chat" selected={view === "chat"} onClick={() => onViewChange?.("chat")}>
          <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
        <RailButton label="Workspace" selected={view === "workspace"} onClick={() => onViewChange?.("workspace")}>
          <GridViewRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
        <RailButton label="Files">
          <FolderOpenRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
        <RailButton label="Assets">
          <ViewQuiltRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
      </Stack>
      <Box sx={{ flex: 1 }} />
      <Stack spacing={0.5} sx={{ alignItems: "center" }}>
        <RailButton label="Help">
          <HelpOutlineRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
        <RailButton label="Sign out">
          <LogoutRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
      </Stack>
    </Stack>
  );
}
