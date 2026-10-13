import { useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Rail } from "./Rail";
import { ChatPanel } from "./ChatPanel";
import { PreviewPanel } from "./PreviewPanel";
import type { ChatItem } from "../../types/chat";
import type { FileMap, SessionEvent } from "@terrarium/contracts";
import type { PreviewStatus } from "../canvas/PreviewPanel";
import type { ViewType } from "../layout/IconRail";

type WorkspaceScreenProps = {
  userName: string;
  chat: ChatItem[];
  prompt: string;
  busy: boolean;
  status: string | null;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSendChoice: (text: string) => void;
  onRetryAnyway?: () => void;
  onAcceptMatch?: (toolId: string) => void;
  onRejectMatch?: () => void;
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onLogout?: () => Promise<void>;
  previewStatus: PreviewStatus;
  previewUrl: string | null;
  previewKey: number;
  events: SessionEvent[];
  files: FileMap | null;
  streamFiles: FileMap | null;
};

export function WorkspaceScreen(props: WorkspaceScreenProps) {
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [chatWidth, setChatWidth] = useState(() => {
    if (typeof window === "undefined") return 440;
    if (window.innerWidth <= 1080) return 360;
    if (window.innerWidth <= 1280) return 410;
    return 440;
  });
  const [previewTab, setPreviewTab] = useState<"preview" | "code" | "events">("preview");
  const appBuilt = props.previewStatus === "live" && Boolean(props.previewUrl);

  function startResize(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setChatCollapsed(false);
    const startX = event.clientX;
    const startWidth = chatWidth;
    const maxWidth = Math.max(360, window.innerWidth - 64 - 280);

    function onMove(moveEvent: PointerEvent) {
      const nextWidth = Math.min(Math.max(startWidth + moveEvent.clientX - startX, 240), maxWidth);
      setChatWidth(nextWidth);
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <main
      className="tw-app"
      data-chat-collapsed={chatCollapsed ? "true" : "false"}
      style={{ "--chat-width": `${chatWidth}px` } as CSSProperties}
    >
      <Rail view={props.view} onViewChange={props.onViewChange} onLogout={props.onLogout} />
      <ChatPanel {...props} />
      <div
        className="tw-split-bar"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat and preview"
        onPointerDown={startResize}
      />
      <PreviewPanel
        tab={previewTab}
        onTabChange={setPreviewTab}
        appBuilt={appBuilt}
        events={props.events}
        files={props.files}
        streamFiles={props.streamFiles}
        previewUrl={props.previewUrl}
        previewStatus={props.previewStatus}
        previewKey={props.previewKey}
      />
    </main>
  );
}
