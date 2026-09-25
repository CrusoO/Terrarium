import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  addMember,
  createGroup,
  listGroups,
  listMembers,
  removeMember,
  type Group,
  type Member,
} from "../../api/groups";

interface Props {
  currentUserId: string;
  currentUserEmail: string;
}

function nameFromEmail(email: string): string {
  const local = email.trim().split("@")[0] ?? "";
  const words = local.replace(/[._-]+/g, " ").trim();
  if (!words) return email;
  return words.replace(/\b\w/g, (char) => char.toUpperCase());
}

function initial(value: string): string {
  return (value.trim().charAt(0) || "?").toUpperCase();
}

const cardSx = {
  p: 2,
  borderRadius: 2,
  bgcolor: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 18px 48px rgba(31, 20, 24, 0.08)",
} as const;

export function GroupsPanel({ currentUserId, currentUserEmail }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [currentUserId]);

  async function load() {
    setLoading(true);
    try {
      setGroups(await listGroups(currentUserEmail));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const created = await createGroup(newGroupName.trim(), currentUserId, currentUserEmail);
      setGroups((prev) => [created, ...prev]);
      setNewGroupName("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleExpand(groupId: string) {
    if (expandedId === groupId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(groupId);
    setMembersLoading(true);
    try {
      setMembers(await listMembers(groupId));
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleAddMember() {
    if (!addMemberGroupId || !memberEmail.trim()) return;
    setAddingMember(true);
    setAddMemberError(null);
    try {
      const member = await addMember(addMemberGroupId, memberEmail.trim());
      if (expandedId === addMemberGroupId) {
        setMembers((prev) => [...prev, member]);
      }
      setGroups((prev) =>
        prev.map((group) =>
          group.id === addMemberGroupId ? { ...group, memberCount: (group.memberCount ?? 0) + 1 } : group
        )
      );
      setAddMemberGroupId(null);
      setMemberEmail("");
    } catch (e) {
      setAddMemberError((e as Error).message);
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(groupId: string, email: string) {
    await removeMember(groupId, email);
    setMembers((prev) => prev.filter((member) => member.email !== email));
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, memberCount: Math.max(0, (group.memberCount ?? 1) - 1) } : group
      )
    );
  }

  const addTarget = groups.find((group) => group.id === addMemberGroupId);

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "transparent", p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 720, mx: "auto" }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
              Team
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.25 }}>
              <GroupsIcon sx={{ color: "primary.main", fontSize: 26 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.03em" }}>
                Groups
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Share published apps with people in the same group.
            </Typography>
          </Box>
        </Stack>

        <Paper variant="outlined" sx={{ ...cardSx, p: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Name this group"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleCreate();
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
              }}
            />
            <Button
              variant="contained"
              startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
              onClick={() => void handleCreate()}
              disabled={creating || !newGroupName.trim()}
              sx={{ borderRadius: 2, px: 2, minWidth: 112, whiteSpace: "nowrap" }}
            >
              Create
            </Button>
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Stack sx={{ alignItems: "center", py: 8 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : groups.length === 0 ? (
          <Paper variant="outlined" sx={{ ...cardSx, p: 4, textAlign: "center" }}>
            <Avatar sx={{ bgcolor: "primary.light", color: "primary.main", width: 48, height: 48, mx: "auto", mb: 1.5 }}>
              <GroupsIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              No groups yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Create a group, add teammates by email, then publish an app to that group.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {groups.map((group) => {
              const open = expandedId === group.id;
              const count = group.memberCount ?? 0;
              return (
                <Paper key={group.id} variant="outlined" sx={cardSx}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40, fontWeight: 700 }}>
                      {initial(group.name)}
                    </Avatar>
                    <Box
                      sx={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                      onClick={() => void toggleExpand(group.id)}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                        {group.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {count} {count === 1 ? "member" : "members"}
                        {group.createdBy === currentUserId ? " · You own this group" : ""}
                      </Typography>
                    </Box>
                    {group.createdBy === currentUserId ? (
                      <Tooltip title="Add member">
                        <IconButton
                          size="small"
                          onClick={() => setAddMemberGroupId(group.id)}
                          sx={{ bgcolor: "#f6f3ee", "&:hover": { bgcolor: "#efecea" } }}
                        >
                          <PersonAddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    <IconButton
                      size="small"
                      onClick={() => void toggleExpand(group.id)}
                      aria-label={open ? "Hide members" : "Show members"}
                    >
                      <ExpandMoreRoundedIcon
                        sx={{
                          transform: open ? "rotate(180deg)" : "none",
                          transition: "transform 160ms ease",
                        }}
                      />
                    </IconButton>
                  </Stack>

                  <Collapse in={open}>
                    <Stack spacing={1} sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: "divider" }}>
                      {membersLoading ? (
                        <Stack sx={{ alignItems: "center", py: 2 }}>
                          <CircularProgress size={20} />
                        </Stack>
                      ) : members.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No members in this group yet.
                        </Typography>
                      ) : (
                        members.map((member) => {
                          const display = nameFromEmail(member.email);
                          const canRemove = group.createdBy === currentUserId && member.email !== currentUserEmail;
                          return (
                            <Stack
                              key={member.user_id}
                              direction="row"
                              spacing={1.25}
                              sx={{ alignItems: "center", py: 0.25 }}
                            >
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  bgcolor: member.role === "admin" ? "primary.light" : "#efecea",
                                  color: member.role === "admin" ? "primary.main" : "text.primary",
                                }}
                              >
                                {initial(display)}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                  {display}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {member.email}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={member.role === "admin" ? "Admin" : "Member"}
                                color={member.role === "admin" ? "primary" : "default"}
                                variant={member.role === "admin" ? "filled" : "outlined"}
                              />
                              {canRemove ? (
                                <Tooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => void handleRemoveMember(group.id, member.email)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : null}
                            </Stack>
                          );
                        })
                      )}
                    </Stack>
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Dialog open={Boolean(addMemberGroupId)} onClose={() => setAddMemberGroupId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Add member{addTarget ? ` to ${addTarget.name}` : ""}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Email address"
              size="small"
              value={memberEmail}
              type="email"
              onChange={(event) => setMemberEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleAddMember();
              }}
              fullWidth
              autoFocus
              helperText="They will see this group after they sign in with that email."
            />
            {addMemberError ? <Alert severity="error">{addMemberError}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setAddMemberGroupId(null);
              setMemberEmail("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleAddMember()}
            disabled={addingMember || !memberEmail.trim()}
          >
            {addingMember ? <CircularProgress size={14} color="inherit" /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
