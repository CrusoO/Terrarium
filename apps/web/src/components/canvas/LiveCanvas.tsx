import type { FileMap, SessionEvent } from "@terrarium/contracts";
import { PreviewPanel, type PreviewStatus } from "./PreviewPanel";

export function LiveCanvas({
  events,
  previewUrl,
  previewStatus,
  files = null,
  tab = "preview",
  onTabChange,
}: {
  events: SessionEvent[];
  previewUrl: string | null;
  previewStatus: PreviewStatus;
  files?: FileMap | null;
  tab?: "preview" | "code";
  onTabChange?: (tab: "preview" | "code") => void;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">
      <PreviewPanel
        events={events}
        previewUrl={previewUrl}
        status={previewStatus}
        files={files}
        tab={tab}
        onTabChange={onTabChange}
      />
    </section>
  );
}
