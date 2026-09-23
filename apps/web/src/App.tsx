import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { ChatPane } from "./components/chat/ChatPane";
import { LiveCanvas } from "./components/canvas/LiveCanvas";
import { WorkspaceDashboard } from "./components/workspace/WorkspaceDashboard";
import { useCreateSession } from "./hooks/useCreateSession";
import { openWorkspaceTool } from "./api/sessions";

export default function App() {
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
    />
  );
}
