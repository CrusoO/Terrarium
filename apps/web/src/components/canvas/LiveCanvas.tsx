import type { SessionEvent } from "@terrarium/contracts";
import { EventPanel } from "./EventPanel";
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
    <section className="flex min-w-0 flex-1 flex-col bg-canvas">
      <header className="flex h-12 items-center justify-between border-b border-line bg-white px-5">
        <p className="text-sm font-medium">Live canvas</p>
        <p className="text-xs text-muted">
          {events.length === 0 ? "Waiting for a session" : `${events.length} event${events.length === 1 ? "" : "s"}`}
        </p>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-5 lg:grid-cols-2">
        <EventPanel events={events} />
        <PreviewPanel previewUrl={previewUrl} status={previewStatus} />
      </div>
    </section>
  );
}
