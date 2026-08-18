import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  createSessionRequestSchema,
  previewReadyPayloadSchema,
  type SessionEvent,
} from "@terrarium/contracts";
import { createSession, subscribeSessionEvents } from "../api/sessions";
import type { ChatItem } from "../types/chat";

export function useCreateSession() {
  const [prompt, setPrompt] = useState("");
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      sourceRef.current?.close();
    };
  }, []);

  function pushEvent(event: SessionEvent) {
    setEvents((current) => [...current, event]);
    setChat((current) => [
      ...current,
      { kind: "event", id: crypto.randomUUID(), event },
    ]);
    if (event.name === "preview.ready") {
      const payload = previewReadyPayloadSchema.safeParse(event.payload);
      if (payload.success) {
        setPreviewUrl(payload.data.previewUrl);
        setBusy(false);
        setStatus(null);
      }
    }
    if (event.name === "sandbox.unhealthy") {
      setBusy(false);
      setStatus("Sandbox failed to start. Check Docker Desktop and infra:up.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createSessionRequestSchema.safeParse({ prompt: prompt.trim() });
    if (!parsed.success || parsed.data.prompt.length === 0) {
      setStatus("Enter a prompt before submitting.");
      return;
    }

    sourceRef.current?.close();
    setPreviewUrl(null);
    setChat((current) => [
      ...current,
      { kind: "user", id: crypto.randomUUID(), text: parsed.data.prompt },
    ]);
    setBusy(true);
    setStatus("Starting session…");
    setPrompt("");

    try {
      const created = await createSession(parsed.data);
      const source = subscribeSessionEvents(created.sessionId, pushEvent);
      source.onerror = () => {
        if (source.readyState === EventSource.CLOSED) {
          setBusy(false);
          setStatus("Lost the session event stream.");
        }
      };
      sourceRef.current = source;
    } catch (error) {
      setBusy(false);
      setStatus(error instanceof Error ? error.message : "Could not reach POST /sessions.");
    }
  }

  return {
    prompt,
    setPrompt,
    events,
    chat,
    status,
    busy,
    previewUrl,
    onSubmit,
  };
}
