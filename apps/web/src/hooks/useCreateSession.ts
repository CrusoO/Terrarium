import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  createSessionRequestSchema,
  previewReadyPayloadSchema,
  type FileMap,
  type SessionEvent,
} from "@terrarium/contracts";
import { createSession, fetchSessionFiles, subscribeSessionEvents } from "../api/sessions";
import type { PreviewStatus } from "../components/canvas/PreviewPanel";
import type { ChatItem } from "../types/chat";

const THINKING_ID = "thinking";
const RECONNECT_MAX = 8;

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
  if (previewUrl) {
    if (busy) {
      return "updating";
    }
    if (phase === "clarify") {
      return "draft";
    }
    return "live";
  }
  if (busy) {
    return "intent";
  }
  if (phase === "clarify") {
    return "clarify";
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
  const [files, setFiles] = useState<FileMap | null>(null);
  const [canvasTab, setCanvasTab] = useState<"preview" | "code">("preview");
  const [intentPhase, setIntentPhase] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const sourceSessionRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastEventIdRef = useRef("0-0");
  const seenEventsRef = useRef(new Set<string>());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    return () => {
      sourceRef.current?.close();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
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

  function scheduleReconnect(sessionId: string) {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
    }
    if (reconnectAttemptsRef.current >= RECONNECT_MAX) {
      setStatus("Lost the session event stream.");
      return;
    }
    const delay = Math.min(800 * 2 ** reconnectAttemptsRef.current, 12_000);
    reconnectAttemptsRef.current += 1;
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      connectEvents(sessionId, true);
    }, delay);
  }

  function connectEvents(nextSessionId: string, force = false) {
    const existing = sourceRef.current;
    if (
      !force &&
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
    source.onopen = () => {
      reconnectAttemptsRef.current = 0;
    };
    source.onerror = () => {
      source.onerror = null;
      source.close();
      if (sourceRef.current === source) {
        sourceRef.current = null;
      }
      scheduleReconnect(nextSessionId);
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
    setChat((current) => [
      ...withoutThinking(current),
      { kind: "event", id: eventId || fingerprint, event },
    ]);
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
        void fetchSessionFiles(event.sessionId)
          .then(setFiles)
          .catch(() => undefined);
      }
    }
    if (event.name === "codegen.completed") {
      void fetchSessionFiles(event.sessionId)
        .then(setFiles)
        .catch(() => undefined);
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
        reconnectAttemptsRef.current = 0;
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
    files,
    canvasTab,
    setCanvasTab,
    previewStatus: previewStatus(busy, intentPhase, previewUrl),
    sessionId,
    onSubmit,
    sendPrompt,
  };
}
