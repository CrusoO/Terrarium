import { LogoMark } from "./LogoMark";
import type { ViewType } from "../layout/IconRail";

const icons = [
  { label: "Assistant", view: "chat" as const, path: "M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7z M5 13l.8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8z" },
  { label: "Apps", view: "workspace" as const, path: "M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z" },
  { label: "Team", view: "groups" as const, path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.9" },
  { label: "Access", view: "security" as const, path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { label: "Notifications", view: "approvals" as const, path: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0" },
  { label: "Files", path: "M3 7h6l2 2h10v10H3z" },
  { label: "Layouts", path: "M3 3h18v18H3z M3 9h18 M9 21V9" },
] satisfies Array<{ label: string; path: string; view?: ViewType }>;

function RailIcon({ path }: { path: string }) {
  return (
    <svg className="tw-icon" viewBox="0 0 24 24" aria-hidden="true">
      {path.split(" M").map((d, index) => (
        <path key={d} d={index === 0 ? d : `M${d}`} />
      ))}
    </svg>
  );
}

export function Rail({
  view = "chat",
  onViewChange,
  onLogout,
}: {
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onLogout?: () => Promise<void>;
}) {
  return (
    <nav className="tw-rail" aria-label="Main">
      <div className="tw-rail-top"><LogoMark /></div>
      <div className="tw-rail-nav">
        {icons.map(({ label, path, view: targetView }) => (
          <button
            key={label}
            className={`tw-icon-btn ${targetView === view ? "active" : ""}`}
            aria-label={label}
            aria-current={targetView === view ? "page" : undefined}
            data-tooltip={label}
            type="button"
            onClick={targetView ? () => onViewChange?.(targetView) : undefined}
          >
            <RailIcon path={path} />
          </button>
        ))}
      </div>
      <div className="tw-rail-bottom">
        <button className="tw-icon-btn" aria-label="Help" data-tooltip="Help" type="button"><RailIcon path="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M9.1 9a3 3 0 1 1 5.2 2c-.8.7-1.3 1.2-1.3 2.4 M12 17h.01" /></button>
        <button className="tw-icon-btn" aria-label="Sign out" data-tooltip="Sign out" type="button" onClick={() => void onLogout?.()}><RailIcon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" /></button>
      </div>
    </nav>
  );
}
