import type { ReactNode } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import GroupsIcon from "@mui/icons-material/Groups";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ViewQuiltRoundedIcon from "@mui/icons-material/ViewQuiltRounded";
import { Avatar, Badge, Box, IconButton, Stack, Tooltip } from "@mui/material";

import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { TerrariumLogo } from "./TerrariumLogo";

export type ViewType = "chat" | "workspace" | "groups" | "approvals" | "security";

type IconRailProps = {
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onLogout?: () => Promise<void>;
  pendingApprovals?: number;
  userName?: string;
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
          color: selected ? "var(--tt-accent-text)" : "text.secondary",
          bgcolor: selected ? "var(--tt-tint)" : "transparent",
          "&:hover": { bgcolor: selected ? "var(--tt-tint)" : "var(--tt-bg)" },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

export function IconRail({
  view = "chat",
  onViewChange,
  onLogout,
  pendingApprovals = 0,
  userName,
}: IconRailProps) {
  const initial = (userName?.trim().charAt(0) || "T").toUpperCase();
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
        bgcolor: "var(--tt-rail)",
        flexShrink: 0,
      }}
    >
      <TerrariumLogo size={44} />
      <Tooltip title={userName ? `Signed in as ${userName}` : "Terrarium"} placement="right">
        <Avatar
          sx={{
            bgcolor: "primary.main",
            width: 32,
            height: 32,
            fontWeight: 700,
            fontSize: 14,
            mt: 1.25,
            mb: 2,
          }}
        >
          {initial}
        </Avatar>
      </Tooltip>
      <Stack spacing={0.5} sx={{ alignItems: "center" }}>
        <RailButton label="Chat" selected={view === "chat"} onClick={() => onViewChange?.("chat")}>
          <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
        <RailButton label="Workspace" selected={view === "workspace"} onClick={() => onViewChange?.("workspace")}>
          <GridViewRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
        <RailButton label="Groups" selected={view === "groups"} onClick={() => onViewChange?.("groups")}>
          <GroupsIcon sx={{ fontSize: 18 }} />
        </RailButton>
        <RailButton label="Security" selected={view === "security"} onClick={() => onViewChange?.("security")}>
          <ShieldRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
        <RailButton
          label={pendingApprovals > 0 ? `Approvals (${pendingApprovals} pending)` : "Approvals"}
          selected={view === "approvals"}
          onClick={() => onViewChange?.("approvals")}
        >
          <Badge badgeContent={pendingApprovals} color="error" max={9}>
            <NotificationsIcon sx={{ fontSize: 18 }} />
          </Badge>
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
        <RailButton label="Sign out" onClick={() => void onLogout?.()}>
          <LogoutRoundedIcon sx={{ fontSize: 18 }} />
        </RailButton>
      </Stack>
    </Stack>
  );
}
