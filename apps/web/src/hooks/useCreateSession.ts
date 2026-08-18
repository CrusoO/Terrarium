import { useState, type FormEvent } from "react";
import { createSessionRequestSchema, type SessionEvent } from "@terrarium/contracts";
import { createSession } from "../api/sessions";
import type { ChatItem } from "../types/chat";

export function useCreateSession() {
  const [prompt, setPrompt] = useState("");
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createSessionRequestSchema.safeParse({ prompt: prompt.trim() });
    if (!parsed.success || parsed.data.prompt.length === 0) {
      setStatus("Enter a prompt before submitting.");
      return;
    }

    setChat((current) => [
      ...current,
      { kind: "user", id: crypto.randomUUID(), text: parsed.data.prompt },
    ]);
    setBusy(true);
    setStatus(null);
    setPrompt("");

    try {
      const created = await createSession(parsed.data);
      const sessionEvent: SessionEvent = {
        name: "session.created",
        sessionId: created.sessionId,
        at: new Date().toISOString(),
      };
      setEvents((current) => [...current, sessionEvent]);
      setChat((current) => [
        ...current,
        { kind: "event", id: crypto.randomUUID(), event: sessionEvent },
      ]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not reach POST /sessions.");
    } finally {
      setBusy(false);
    }
  }

  return { prompt, setPrompt, events, chat, status, busy, onSubmit };
}
