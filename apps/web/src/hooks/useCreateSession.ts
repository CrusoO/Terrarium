import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  createSessionRequestSchema,
  previewReadyPayloadSchema,
  type SessionEvent,
} from "@terrarium/contracts";
import { createSession, subscribeSessionEvents } from "../api/sessions";
import type { PreviewStatus } from "../components/canvas/PreviewPanel";
import type { ChatItem } from "../types/chat";

const THINKING_ID = "thinking";

function stringField(payload: Record<string, unknown> | undefined, key: string): string {
  const value = payload?.[key];
  return typeof value === "string" ? value : "";
}

function stringList(payload: Record<string, unknown> | undefined, key: string): string[] {
  const value = payload?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function withoutThinking(items: ChatItem[]): ChatItem[] {
  return items.filter((item) => item.kind !== "thinking");
}

function withThinking(items: ChatItem[], label: string): ChatItem[] {
  return [...withoutThinking(items), { kind: "thinking", id: THINKING_ID, label }];
}

function previewStatus(
  busy: boolean,
  phase: string | null,
  previewUrl: string | null,
): PreviewStatus {
  if (busy) {
    return "intent";
  }
  if (phase === "clarify") {
    return "clarify";
  }
  if (previewUrl) {
    return "live";
  }
  if (phase === "ready") {
    return "ready";
  }
  return "idle";
}

export function useCreateSession() {
  const [prompt, setPrompt] = useState("");
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [intentPhase, setIntentPhase] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const sourceSessionRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastEventIdRef = useRef("0-0");
  const seenEventsRef = useRef(new Set<string>());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      sourceRef.current?.close();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function armTimeout() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      busyRef.current = false;
      setBusy(false);
      setChat((current) => withoutThinking(current));
      setStatus("The agent took too long. Send the message again.");
    }, 45_000);
  }

  function clearTimeoutSafe() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function connectEvents(nextSessionId: string) {
    const existing = sourceRef.current;
    if (
      existing &&
      sourceSessionRef.current === nextSessionId &&
      existing.readyState !== EventSource.CLOSED
    ) {
      return;
    }
    if (existing) {
      existing.onerror = null;
      existing.close();
    }
    const source = subscribeSessionEvents(nextSessionId, pushEvent, lastEventIdRef.current);
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        busyRef.current = false;
        setBusy(false);
        clearTimeoutSafe();
        setChat((current) => withoutThinking(current));
        setStatus("Lost the session event stream.");
      }
    };
    sourceRef.current = source;
    sourceSessionRef.current = nextSessionId;
  }

  function pushEvent(event: SessionEvent, eventId?: string) {
    if (eventId) {
      lastEventIdRef.current = eventId;
    }
    const fingerprint = `${event.sessionId}:${event.at}:${event.name}`;
    const keys = [eventId, fingerprint].filter((key): key is string => Boolean(key));
    if (keys.some((key) => seenEventsRef.current.has(key))) {
      return;
    }
    for (const key of keys) {
      seenEventsRef.current.add(key);
    }

    setEvents((current) => [...current, event]);
    if (event.name === "intent.classified") {
      const payload = event.payload;
      const reply = stringField(payload, "reply");
      const phase = stringField(payload, "phase");
      const questions = stringList(payload, "questions");
      setIntentPhase(phase);
      const assistant: ChatItem = {
        kind: "assistant",
        id: crypto.randomUUID(),
        text: reply || (questions.length ? "I can build that. A few details so we get it right." : "Hey — what should we build?"),
        questions: questions.length ? questions : undefined,
        phase,
      };
      busyRef.current = false;
      setChat((current) => [...withoutThinking(current), assistant]);
      setBusy(false);
      clearTimeoutSafe();
      setStatus(null);
    }
    if (event.name === "preview.ready") {
      const payload = previewReadyPayloadSchema.safeParse(event.payload);
      if (payload.success) {
        setPreviewUrl(payload.data.previewUrl);
        setChat((current) => withoutThinking(current));
        busyRef.current = false;
        setBusy(false);
        clearTimeoutSafe();
        setStatus(null);
      }
    }
    if (event.name === "sandbox.unhealthy") {
      busyRef.current = false;
      setBusy(false);
      clearTimeoutSafe();
      setChat((current) => withoutThinking(current));
      const logs =
        event.payload && typeof event.payload.logs === "string"
          ? event.payload.logs
          : "";
      setStatus(
        logs
          ? `Build failed: ${logs}`
          : "Sandbox failed to start. Check Docker Desktop and infra:up."
      );
    }
  }

  async function sendPrompt(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busyRef.current) {
      return;
    }
    const parsed = createSessionRequestSchema.safeParse({
      prompt: trimmed,
      sessionId: sessionIdRef.current ?? undefined,
    });
    if (!parsed.success) {
      setStatus("Enter a prompt before submitting.");
      return;
    }

    busyRef.current = true;
    setChat((current) =>
      withThinking(
        [...withoutThinking(current), { kind: "user", id: crypto.randomUUID(), text: parsed.data.prompt }],
        "Thinking"
      )
    );
    setBusy(true);
    setStatus(null);
    setPrompt("");
    setIntentPhase("intent");
    armTimeout();

    try {
      const created = await createSession(parsed.data);
      if (sessionIdRef.current !== created.sessionId) {
        lastEventIdRef.current = "0-0";
        seenEventsRef.current.clear();
      }
      sessionIdRef.current = created.sessionId;
      setSessionId(created.sessionId);
      connectEvents(created.sessionId);
    } catch (error) {
      busyRef.current = false;
      setBusy(false);
      clearTimeoutSafe();
      setChat((current) => withoutThinking(current));
      setStatus(error instanceof Error ? error.message : "Could not reach POST /sessions.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendPrompt(prompt);
  }

  return {
    prompt,
    setPrompt,
    events,
    chat,
    status,
    busy,
    previewUrl,
    previewStatus: previewStatus(busy, intentPhase, previewUrl),
    sessionId,
    onSubmit,
    sendPrompt,
  };
}
