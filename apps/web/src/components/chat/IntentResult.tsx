import type { SessionEvent } from "@terrarium/contracts";

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function IntentResult({ event }: { event: SessionEvent }) {
  const kind = text(event.payload?.kind);
  const stack = text(event.payload?.stack);
  const summary = text(event.payload?.summary);
  const toolId = text(event.payload?.toolId);
  const phase = text(event.payload?.phase);
  if (!kind && !stack && !summary) {
    return null;
  }

  return (
    <div className="mt-2 rounded-lg border border-maroon/20 bg-white p-2">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        Intent classified
      </p>
      <div className="flex flex-wrap gap-1.5">
        {kind ? (
          <span
            className={
              kind === "modify"
                ? "rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                : "rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
            }
          >
            {kind}
          </span>
        ) : null}
        {stack ? (
          <span
            className={
              stack === "fullstack"
                ? "rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800"
                : "rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800"
            }
          >
            {stack}
          </span>
        ) : null}
        {toolId ? (
          <span className="rounded-full bg-maroon-soft px-2 py-0.5 text-[11px] font-semibold text-maroon">
            {toolId}
          </span>
        ) : null}
      </div>
      {summary ? (
        <p className="mt-2 text-sm leading-snug text-ink">{summary}</p>
      ) : null}
      {phase ? (
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
          phase: {phase}
        </p>
      ) : null}
    </div>
  );
}
