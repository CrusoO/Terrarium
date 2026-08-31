import type { SessionEvent } from "@terrarium/contracts";
import { PreviewPanel, type PreviewStatus } from "./PreviewPanel";

export function LiveCanvas({
  events,
  previewUrl,
  previewStatus,
}: {
  events: SessionEvent[];
  previewUrl: string | null;
  previewStatus: PreviewStatus;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">
      <PreviewPanel events={events} previewUrl={previewUrl} status={previewStatus} />
    </section>
  );
}
