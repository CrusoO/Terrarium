import type { FormEvent } from "react";
import type { ChatItem } from "../../types/chat";
import { ChatThread } from "./ChatThread";
import { PromptForm } from "./PromptForm";

type ChatPaneProps = {
  chat: ChatItem[];
  prompt: string;
  busy: boolean;
  status: string | null;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ChatPane({ chat, prompt, busy, status, onPromptChange, onSubmit }: ChatPaneProps) {
  return (
    <aside className="flex h-[46%] w-full shrink-0 flex-col border-b border-line bg-white md:h-auto md:w-[380px] md:border-b-0 md:border-r">
      <header className="border-b border-line px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-maroon">Terrarium</p>
        <h1 className="mt-1 text-lg font-semibold">App builder</h1>
        <p className="mt-1 text-xs text-muted">Prompt on the left. Watch the tool take shape on the right.</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <ChatThread chat={chat} />
      </div>
      <PromptForm
        prompt={prompt}
        busy={busy}
        status={status}
        onPromptChange={onPromptChange}
        onSubmit={onSubmit}
      />
    </aside>
  );
}
