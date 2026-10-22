import { Box, CircularProgress } from "@mui/material";
import { LoginPage } from "./components/auth/LoginPage";
import { AppShell } from "./components/layout/AppShell";
import { ModeFooter } from "./components/layout/ModeFooter";
import { type ViewType } from "./components/layout/IconRail";
import { WorkspaceDashboard } from "./components/workspace/WorkspaceDashboard";
import { GroupsPanel } from "./components/groups/GroupsPanel";
import { ApprovalsPanel } from "./components/groups/ApprovalsPanel";
import { SecurityPage } from "./components/security/SecurityPage";
import { WorkspaceScreen } from "./components/workspace/WorkspaceScreen";
import { fetchWorkspaceTools } from "./api/sessions";
import { useEffect, useState } from "react";
import type { ToolSummary } from "@terrarium/contracts";
import { useAuth } from "./hooks/useAuth";
import { useCreateSession } from "./hooks/useCreateSession";
import { useAccessRequests } from "./hooks/useAccessRequests";
import { openWorkspaceTool } from "./api/sessions";

function displayNameFromEmail(email: string): string {
  const local = email.trim().split("@")[0] ?? "";
  const words = local.replace(/[._-]+/g, " ").trim();
  if (!words) {
    return "You";
  }
  return words.replace(/\b\w/g, (char) => char.toUpperCase());
}

function MainApp({
  onLogout,
  userId,
  userEmail,
  userName,
}: {
  onLogout: () => Promise<void>;
  userId: string;
  userEmail: string;
  userName: string;
}) {
  const session = useCreateSession();
  const [view, setView] = useState<ViewType>("chat");
  const [securityTools, setSecurityTools] = useState<ToolSummary[]>([]);
  const { pending, approve, deny } = useAccessRequests(userId);

  useEffect(() => {
    if (view !== "security") {
      return;
    }
    void fetchWorkspaceTools().then(setSecurityTools).catch(() => setSecurityTools([]));
  }, [view]);

  async function handleOpenTool(toolId: string) {
    const opened = await openWorkspaceTool(toolId);
    session.openPublished(opened);
    setView("chat");
  }

  const sidePanel =
    view === "groups" ? (
      <GroupsPanel currentUserId={userId} currentUserEmail={userEmail} />
    ) : view === "approvals" ? (
      <ApprovalsPanel pending={pending} onApprove={approve} onDeny={deny} />
    ) : view === "workspace" ? (
      <WorkspaceDashboard onOpenTool={handleOpenTool} currentUserId={userId} currentUserEmail={userEmail} />
    ) : view === "security" ? (
      <SecurityPage tools={securityTools} />
    ) : null;

  if (view !== "chat") {
    return (
      <AppShell
        chat={<div />}
        canvas={sidePanel ?? <div />}
        view={view}
        onViewChange={setView}
        onLogout={onLogout}
      />
    );
  }

  return (
    <WorkspaceScreen
      userName={userName}
      chat={session.chat}
      prompt={session.prompt}
      busy={session.busy}
      status={session.status}
      onPromptChange={session.setPrompt}
      onSubmit={session.onSubmit}
      onSendChoice={session.sendPrompt}
      onRetryAnyway={session.retryAnyway}
      onAcceptMatch={session.acceptMatch}
      onRejectMatch={session.rejectMatch}
      onStackSelect={session.handleStackSelect}
      view={view}
      onViewChange={setView}
      onLogout={onLogout}
      previewStatus={session.previewStatus}
      previewUrl={session.previewUrl}
      previewKey={session.previewKey}
      events={session.events}
      files={session.files}
      streamFiles={session.streamFiles}
    />
  );
}

export default function App() {
  const auth = useAuth();

  if (auth.state.status === "loading") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <CircularProgress />
        <ModeFooter />
      </Box>
    );
  }

  if (auth.state.status === "unauthenticated") {
    return (
      <>
        <LoginPage onLogin={auth.login} onSignup={auth.signup} />
        <ModeFooter />
      </>
    );
  }

  const user = auth.state.status === "authenticated" ? auth.state.user : null;
  return (
    <>
      <MainApp
        onLogout={auth.logout}
        userId={user?.uid ?? ""}
        userEmail={user?.email ?? ""}
        userName={displayNameFromEmail(user?.email ?? "")}
      />
      <ModeFooter />
    </>
  );
}
