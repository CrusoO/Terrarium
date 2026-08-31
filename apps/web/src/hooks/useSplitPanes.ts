import { useCallback, useEffect, useRef, useState } from "react";

const WIDTH_KEY = "terrarium.chatWidth";
const HEIGHT_KEY = "terrarium.chatHeight";
const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 360;
const MIN_CHAT_WIDTH = 280;
const MIN_CHAT_HEIGHT = 180;
const MIN_CANVAS = 280;
const HANDLE = 8;
const RAIL = 64;
const MD_QUERY = "(min-width: 768px)";

function readNumber(key: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(Math.round(value)));
  } catch {
    /* ignore quota / private mode */
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useSplitPanes() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [desktop, setDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MD_QUERY).matches : true,
  );
  const [chatWidth, setChatWidth] = useState(() => readNumber(WIDTH_KEY, DEFAULT_WIDTH));
  const [chatHeight, setChatHeight] = useState(() => readNumber(HEIGHT_KEY, DEFAULT_HEIGHT));
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ start: number; size: number; desktop: boolean } | null>(null);

  const bounds = useCallback(() => {
    const rect = shellRef.current?.getBoundingClientRect();
    const width = rect?.width ?? window.innerWidth;
    const height = rect?.height ?? window.innerHeight;
    const maxWidth = Math.max(MIN_CHAT_WIDTH, width - RAIL - MIN_CANVAS - HANDLE);
    const maxHeight = Math.max(MIN_CHAT_HEIGHT, height - MIN_CANVAS - HANDLE);
    return { maxWidth, maxHeight };
  }, []);

  const applySize = useCallback(
    (next: number, isDesktop = desktop) => {
      const { maxWidth, maxHeight } = bounds();
      if (isDesktop) {
        const size = clamp(next, MIN_CHAT_WIDTH, maxWidth);
        setCollapsed(false);
        setChatWidth(size);
        writeNumber(WIDTH_KEY, size);
        return;
      }
      const size = clamp(next, MIN_CHAT_HEIGHT, maxHeight);
      setCollapsed(false);
      setChatHeight(size);
      writeNumber(HEIGHT_KEY, size);
    },
    [bounds, desktop],
  );

  useEffect(() => {
    const media = window.matchMedia(MD_QUERY);
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!dragging) {
      return;
    }
    const previous = document.body.style.cursor;
    const select = document.body.style.userSelect;
    document.body.style.cursor = desktop ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";

    function onMove(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }
      const point = drag.desktop ? event.clientX : event.clientY;
      applySize(drag.size + (point - drag.start), drag.desktop);
    }

    function onUp() {
      dragRef.current = null;
      setDragging(false);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      document.body.style.cursor = previous;
      document.body.style.userSelect = select;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applySize, desktop, dragging]);

  function onHandlePointerDown(event: { button: number; clientX: number; clientY: number }) {
    if (event.button !== 0) {
      return;
    }
    dragRef.current = {
      start: desktop ? event.clientX : event.clientY,
      size: desktop ? chatWidth : chatHeight,
      desktop,
    };
    setDragging(true);
  }

  function expandChat() {
    const { maxWidth, maxHeight } = bounds();
    applySize(desktop ? maxWidth : maxHeight);
  }

  function shrinkChat() {
    applySize(desktop ? MIN_CHAT_WIDTH : MIN_CHAT_HEIGHT);
  }

  function resetChat() {
    applySize(desktop ? DEFAULT_WIDTH : DEFAULT_HEIGHT);
  }

  function collapseChat() {
    setCollapsed(true);
    setDragging(false);
    dragRef.current = null;
  }

  function restoreChat() {
    setCollapsed(false);
  }

  return {
    shellRef,
    desktop,
    dragging,
    collapsed,
    chatWidth,
    chatHeight,
    onHandlePointerDown,
    expandChat,
    shrinkChat,
    resetChat,
    collapseChat,
    restoreChat,
  };
}
