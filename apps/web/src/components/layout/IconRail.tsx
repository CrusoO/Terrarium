import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import { Avatar, IconButton, Stack, Tooltip } from "@mui/material";

export function IconRail() {
  return (
    <Stack
      component="nav"
      spacing={1}
      sx={{
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        width: 64,
        py: 2,
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        flexShrink: 0,
      }}
    >
      <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontWeight: 800, fontSize: 15, mb: 1 }}>T</Avatar>
      <Tooltip title="Chat" placement="right">
        <IconButton color="primary" aria-label="Chat">
          <ChatBubbleOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Files" placement="right">
        <IconButton aria-label="Files" sx={{ color: "text.secondary" }}>
          <FolderOpenRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Assets" placement="right">
        <IconButton aria-label="Assets" sx={{ color: "text.secondary" }}>
          <PermMediaOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
