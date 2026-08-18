import type { ChatItem } from "../../types/chat";

export function ChatThread({ chat }: { chat: ChatItem[] }) {
  if (chat.length === 0) {
    return (
      <p className="rounded-lg bg-maroon-soft px-3 py-3 text-sm text-maroon-dark">
        Ask for a tool. Activity from agents and the sandbox will show up here, next to the live canvas.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {chat.map((item) =>
        item.kind === "user" ? (
          <li key={item.id} className="ml-8 rounded-2xl rounded-br-sm bg-maroon px-3 py-2 text-sm text-white">
            {item.text}
          </li>
        ) : (
          <li
            key={item.id}
            className="mr-8 rounded-2xl rounded-bl-sm border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
          >
            <span className="font-semibold text-maroon">{item.event.name}</span>
            <div className="mt-1 text-muted">{item.event.sessionId}</div>
          </li>
        )
      )}
    </ol>
  );
}
