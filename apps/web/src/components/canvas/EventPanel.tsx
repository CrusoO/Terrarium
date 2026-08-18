import type { SessionEvent } from "@terrarium/contracts";

export function EventPanel({ events }: { events: SessionEvent[] }) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-maroon">
        What is happening
      </div>
      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 font-mono text-xs">
        {events.length === 0 ? (
          <li className="text-muted">No SessionEvents yet. Submit a prompt to start the SSE stream.</li>
        ) : (
          events.map((item, index) => (
            <li
              key={`${item.sessionId}-${item.at}-${item.name}-${index}`}
              className="rounded-md bg-maroon-soft px-3 py-2"
            >
              <span className="font-semibold text-maroon">{item.name}</span>
              <div className="mt-1 text-muted">{item.at}</div>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
