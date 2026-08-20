import { AppShell } from "./components/layout/AppShell";
import { ChatPane } from "./components/chat/ChatPane";
import { LiveCanvas } from "./components/canvas/LiveCanvas";
import { useCreateSession } from "./hooks/useCreateSession";

export default function App() {
  const session = useCreateSession();

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
        />
      }
      canvas={
        <LiveCanvas
          events={session.events}
          previewUrl={session.previewUrl}
          previewStatus={session.previewStatus}
        />
      }
    />
  );
}
