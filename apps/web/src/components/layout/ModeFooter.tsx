import { useEffect, useState } from "react";

export function ModeFooter() {
  const [text, setText] = useState("Codegen mode: …");

  useEffect(() => {
    let cancelled = false;
    fetch("/health")
      .then((response) => response.json())
      .then((body: { codegenMode?: string; demoMode?: boolean }) => {
        if (cancelled) return;
        const mode = body.codegenMode || "replay";
        const demo = body.demoMode ? "Demo. " : "";
        const replay = mode === "replay" ? " Replaying a recorded generation." : "";
        setText(`${demo}Codegen mode: ${mode}.${replay}`);
      })
      .catch(() => {
        if (!cancelled) setText("Codegen mode: unknown");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 8,
        zIndex: 30,
        fontSize: 12,
        lineHeight: 1.4,
        color: "var(--tt-ink, #3c3234)",
        background: "var(--tt-bg, #fff)",
        border: "1px solid var(--tt-line, #ddd)",
        borderRadius: 6,
        padding: "4px 8px",
      }}
    >
      {text}
    </div>
  );
}
