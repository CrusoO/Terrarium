import { useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { LoginPage } from "./components/auth/LoginPage";
import { AppShell } from "./components/layout/AppShell";
import { type ViewType } from "./components/layout/IconRail";
import { ChatPane } from "./components/chat/ChatPane";
import { LiveCanvas } from "./components/canvas/LiveCanvas";
import { WorkspaceDashboard } from "./components/workspace/WorkspaceDashboard";
import { GroupsPanel } from "./components/groups/GroupsPanel";
import { ApprovalsPanel } from "./components/groups/ApprovalsPanel";
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
  const { pending, approve, deny } = useAccessRequests(userId);

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
    ) : null;

  if (view !== "chat") {
    return (
      <AppShell
        chat={<div />}
        canvas={sidePanel ?? <div />}
        view={view}
        onViewChange={setView}
        onLogout={onLogout}
        pendingApprovals={pending.length}
        userName={userName}
      />
    );
  }

  return (
    <AppShell
      chat={
        <ChatPane
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
          canEdit={session.toolRole !== "viewer"}
          editRequestStatus={session.editRequestStatus}
          onRequestEdit={() => void session.requestEdit(userId, userEmail)}
        />
      }
      canvas={
        <LiveCanvas
          events={session.events}
          previewUrl={session.previewUrl}
          previewStatus={session.previewStatus}
          files={session.files}
          streamFiles={session.streamFiles}
          sessionId={session.sessionId}
          tab={session.canvasTab}
          onTabChange={session.setCanvasTab}
          onRuntimeError={session.onPreviewRuntimeError}
          refreshKey={session.previewKey}
        />
      }
      view={view}
      onViewChange={setView}
      onLogout={onLogout}
      pendingApprovals={pending.length}
      userName={userName}
    />
  );
}

export default function App() {
  const auth = useAuth();

  if (auth.state.status === "loading") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (auth.state.status === "unauthenticated") {
    return <LoginPage onLogin={auth.login} onSignup={auth.signup} />;
  }

  const user = auth.state.status === "authenticated" ? auth.state.user : null;
  return (
    <MainApp
      onLogout={auth.logout}
      userId={user?.uid ?? ""}
      userEmail={user?.email ?? ""}
      userName={displayNameFromEmail(user?.email ?? "")}
    />
  );
}
