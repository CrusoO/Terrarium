import type { FileMap, RuntimeErrorRequest, SessionEvent } from "@terrarium/contracts";
import { PreviewPanel, type PreviewStatus } from "./PreviewPanel";

export function LiveCanvas({
  events,
  previewUrl,
  previewStatus,
  files = null,
  streamFiles = null,
  sessionId = null,
  tab = "preview",
  onTabChange,
  onRuntimeError,
  refreshKey = 0,
}: {
  events: SessionEvent[];
  previewUrl: string | null;
  previewStatus: PreviewStatus;
  files?: FileMap | null;
  streamFiles?: FileMap | null;
  sessionId?: string | null;
  tab?: "preview" | "code";
  onTabChange?: (tab: "preview" | "code") => void;
  onRuntimeError?: (error: RuntimeErrorRequest) => void;
  refreshKey?: number;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">
      <PreviewPanel
        events={events}
        previewUrl={previewUrl}
        status={previewStatus}
        files={files}
        streamFiles={streamFiles}
        sessionId={sessionId}
        tab={tab}
        onTabChange={onTabChange}
        onRuntimeError={onRuntimeError}
        refreshKey={refreshKey}
      />
    </section>
  );
}
