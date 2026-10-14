import { useEffect, useRef, type FormEvent } from "react";
import { Wordmark } from "./Wordmark";
import { ChatThread } from "../chat/ChatThread";
import type { ChatItem } from "../../types/chat";

type ChatPanelProps = {
  userName: string;
  chat: ChatItem[];
  prompt: string;
  busy: boolean;
  status: string | null;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSendChoice: (text: string) => void;
  onRetryAnyway?: () => void;
  onAcceptMatch?: (toolId: string) => void;
  onRejectMatch?: () => void;
};

export function ChatPanel({
  userName,
  chat,
  prompt,
  busy,
  status,
  onPromptChange,
  onSubmit,
  onSendChoice,
  onRetryAnyway,
  onAcceptMatch,
  onRejectMatch,
}: ChatPanelProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [chat]);

  return (
    <section className="tw-chat" aria-label="Chat">
      <header className="tw-chat-head">
        <Wordmark />
        <div className="tw-user">{userName}<span className="tw-green-dot" aria-hidden="true" /></div>
      </header>
      <div className="tw-chat-body">
        <div className="tw-chat-scroll" ref={scrollerRef}>
          {chat.length === 0 ? (
            <div className="tw-terra-row">
              <div className="tw-terra-avatar" aria-hidden="true">
                <svg className="tw-icon" viewBox="0 0 24 24"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" /></svg>
              </div>
              <div>
                <p className="tw-terra-name">Terra</p>
                <p className="tw-terra-question">What kind of app should we build today?</p>
                <p className="tw-helper">Tell Terra what you need in your own words.</p>
              </div>
            </div>
          ) : (
            <ChatThread
              chat={chat}
              busy={busy}
              onSendChoice={onSendChoice}
              onRetryAnyway={onRetryAnyway}
              onAcceptMatch={onAcceptMatch}
              onRejectMatch={onRejectMatch}
            />
          )}
          {status ? <div className="tw-status-error">{status}</div> : null}
        </div>
        <form className="tw-composer" onSubmit={onSubmit}>
          <div className="tw-composer-pill">
            <input
              aria-label="Describe the app you want to build"
              placeholder="Describe the app you want to build..."
              value={prompt}
              disabled={busy}
              onChange={(event) => onPromptChange(event.target.value)}
            />
            <button className="tw-image-btn" aria-label="Attach image" data-tooltip="Attach image" type="button">
              <svg className="tw-icon" viewBox="0 0 24 24"><path d="M3 5h18v14H3z M8 11l3 3 2-2 4 4 M8 8h.01" /></svg>
            </button>
            <button className="tw-send-btn" aria-label="Send" data-tooltip="Send" type="submit" disabled={busy}>
              {busy ? (
                <span className="tw-send-spinner" aria-hidden="true" />
              ) : (
                <svg className="tw-icon" viewBox="0 0 24 24"><path d="M22 2L11 13 M22 2l-7 20-4-9-9-4z" /></svg>
              )}
            </button>
          </div>
          <div className="tw-hint">Enter to send · Shift+Enter for new line</div>
        </form>
      </div>
    </section>
  );
}
