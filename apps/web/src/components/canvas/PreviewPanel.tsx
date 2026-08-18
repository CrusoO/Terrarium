export function PreviewPanel() {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-maroon">
        Generated tool
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[linear-gradient(45deg,#f6f3f2_25%,transparent_25%,transparent_75%,#f6f3f2_75%),linear-gradient(45deg,#f6f3f2_25%,transparent_25%,transparent_75%,#f6f3f2_75%)] bg-[length:24px_24px] bg-[position:0_0,12px_12px] p-6">
        <div className="max-w-sm rounded-xl border border-line bg-white p-6 text-center shadow-md">
          <p className="text-sm font-semibold text-maroon">Preview iframe</p>
          <p className="mt-2 text-sm text-muted">
            The live sandbox URL will render here side by side with chat, the same way Figma keeps the file next to comments.
          </p>
        </div>
      </div>
    </div>
  );
}
