import { useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { LoginPage } from "./components/auth/LoginPage";
import { AppShell } from "./components/layout/AppShell";
import { ChatPane } from "./components/chat/ChatPane";
import { LiveCanvas } from "./components/canvas/LiveCanvas";
import { WorkspaceDashboard } from "./components/workspace/WorkspaceDashboard";
import { useAuth } from "./hooks/useAuth";
import { useCreateSession } from "./hooks/useCreateSession";
import { openWorkspaceTool } from "./api/sessions";

function MainApp({ onLogout }: { onLogout: () => Promise<void> }) {
  const session = useCreateSession();
  const [view, setView] = useState<"chat" | "workspace">("chat");

  async function handleOpenTool(toolId: string) {
    const opened = await openWorkspaceTool(toolId);
    session.openPublished(opened);
    setView("chat");
  }

  if (view === "workspace") {
    return (
      <div className="flex h-screen">
        <AppShell
          chat={<div />}
          canvas={<WorkspaceDashboard onOpenTool={handleOpenTool} />}
          view={view}
          onViewChange={setView}
          onLogout={onLogout}
        />
      </div>
    );
  }

  return (
    <AppShell
      chat={
        <ChatPane
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

  return <MainApp onLogout={auth.logout} />;
}
