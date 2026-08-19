import type { ChatItem } from "../../types/chat";
import { ClarifyAnswers } from "./ClarifyAnswers";
import { IntentResult } from "./IntentResult";
import { ThinkingIndicator } from "./ThinkingIndicator";

type ChatThreadProps = {
  chat: ChatItem[];
  busy?: boolean;
  onSendChoice?: (text: string) => void;
};

function latestUnansweredAssistantId(chat: ChatItem[]): string | null {
  for (let index = chat.length - 1; index >= 0; index -= 1) {
    const item = chat[index];
    if (item.kind === "user" || item.kind === "thinking") {
      return null;
    }
    if (item.kind === "assistant" && item.questions && item.questions.length > 0) {
      return item.id;
    }
  }
  return null;
}

export function ChatThread({ chat, busy = false, onSendChoice }: ChatThreadProps) {
  if (chat.length === 0) {
    return (
      <p className="rounded-lg bg-maroon-soft px-3 py-3 text-sm text-maroon-dark">
        Say hi, or describe a tool. I will ask a few questions before we build.
      </p>
    );
  }

  const activeId = latestUnansweredAssistantId(chat);

  return (
    <ol className="space-y-3">
      {chat.map((item) => {
        if (item.kind === "user") {
          return (
            <li key={item.id} className="ml-8 rounded-2xl rounded-br-sm bg-maroon px-3 py-2 text-sm text-white">
              {item.text}
            </li>
          );
        }
        if (item.kind === "thinking") {
          return (
            <li
              key={item.id}
              className="mr-4 rounded-2xl rounded-bl-sm border border-line bg-white px-3 py-2 shadow-sm"
            >
              <ThinkingIndicator label={item.label} />
            </li>
          );
        }
        if (item.kind === "assistant") {
          const active = item.id === activeId && !busy && Boolean(onSendChoice);
          return (
            <li
              key={item.id}
              className="mr-4 rounded-2xl rounded-bl-sm border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm"
            >
              {item.phase === "ready" ? (
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Ready to build
                </p>
              ) : null}
              {item.phase === "clarify" ? (
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-maroon">
                  A few details
                </p>
              ) : null}
              <p className="whitespace-pre-wrap leading-relaxed">{item.text}</p>
              {item.questions && item.questions.length > 0 ? (
                active ? (
                  <ClarifyAnswers questions={item.questions} onSend={(text) => onSendChoice?.(text)} />
                ) : (
                  <ol className="mt-2 space-y-1.5 rounded-lg bg-maroon-soft p-2">
                    {item.questions.map((question, index) => (
                      <li key={`${item.id}-${index}`} className="flex gap-2 text-[13px] text-maroon-dark">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-maroon text-[11px] font-semibold text-white">
                          {index + 1}
                        </span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ol>
                )
              ) : null}
            </li>
          );
        }
        return (
          <li
            key={item.id}
            className="mr-8 rounded-2xl rounded-bl-sm border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
          >
            <span className="font-semibold text-maroon">{item.event.name}</span>
            {item.event.name === "intent.classified" ? (
              <IntentResult event={item.event} />
            ) : (
              <div className="mt-1 text-muted">{item.event.sessionId}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
