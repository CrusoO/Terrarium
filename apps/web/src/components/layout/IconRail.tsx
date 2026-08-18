export function IconRail() {
  return (
    <nav className="hidden w-14 shrink-0 flex-col items-center gap-4 border-r border-line bg-white py-4 md:flex">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-maroon text-xs font-bold text-white">
        T
      </div>
      <RailIcon label="Chat" active />
      <RailIcon label="Files" />
      <RailIcon label="Assets" />
    </nav>
  );
}

function RailIcon({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-semibold ${
        active ? "bg-maroon-soft text-maroon" : "text-muted hover:bg-canvas"
      }`}
    >
      {label.slice(0, 1)}
    </button>
  );
}
