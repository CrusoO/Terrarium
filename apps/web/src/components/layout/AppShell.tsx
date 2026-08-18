import type { ReactNode } from "react";
import { IconRail } from "./IconRail";

export function AppShell({ chat, canvas }: { chat: ReactNode; canvas: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-ink md:flex-row">
      <IconRail />
      {chat}
      {canvas}
    </div>
  );
}
