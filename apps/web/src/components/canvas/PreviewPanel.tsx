export function PreviewPanel({ previewUrl }: { previewUrl: string | null }) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-maroon">
        Generated tool
      </div>
      {previewUrl ? (
        <>
          <p className="border-b border-line px-4 py-1.5 font-mono text-[10px] text-muted break-all">
            {previewUrl}
          </p>
          <iframe
            title="Generated tool preview"
            src={previewUrl}
            className="min-h-0 flex-1 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[linear-gradient(45deg,#f6f3f2_25%,transparent_25%,transparent_75%,#f6f3f2_75%),linear-gradient(45deg,#f6f3f2_25%,transparent_25%,transparent_75%,#f6f3f2_75%)] bg-[length:24px_24px] bg-[position:0_0,12px_12px] p-6">
          <div className="max-w-sm rounded-xl border border-line bg-white p-6 text-center shadow-md">
            <p className="text-sm font-semibold text-maroon">Preview iframe</p>
            <p className="mt-2 text-sm text-muted">
              The live sandbox URL will render here when preview.ready fires.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
