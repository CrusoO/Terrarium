export type StreamTag = "plan" | "file" | "edit" | "diagnosis" | "verify" | "escalate";

export type StreamParserEvent =
  | { type: "tag-start"; tag: StreamTag; attrs: Record<string, string> }
  | { type: "tag-chunk"; tag: StreamTag; attrs: Record<string, string>; content: string }
  | { type: "tag-end"; tag: StreamTag; attrs: Record<string, string>; content: string };

const TAG_RE = /<(plan|file|edit|diagnosis|verify|escalate)\b([^>]*)>|<\/(plan|file|edit|diagnosis|verify|escalate)>/gi;
const ATTR_RE = /([a-zA-Z][\w-]*)="([^"]*)"/g;

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(ATTR_RE)) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

export class StreamParser {
  private buffer = "";
  private active: { tag: StreamTag; attrs: Record<string, string>; content: string } | null = null;

  push(chunk: string): StreamParserEvent[] {
    this.buffer += chunk;
    const events: StreamParserEvent[] = [];
    let consumed = 0;
    TAG_RE.lastIndex = 0;

    for (const match of this.buffer.matchAll(TAG_RE)) {
      const index = match.index ?? 0;
      if (this.active && index > consumed) {
        const content = this.buffer.slice(consumed, index);
        this.active.content += content;
        events.push({ type: "tag-chunk", ...this.active, content });
      }

      if (match[1]) {
        this.active = {
          tag: match[1].toLowerCase() as StreamTag,
          attrs: parseAttrs(match[2] || ""),
          content: "",
        };
        events.push({ type: "tag-start", ...this.active });
      } else if (match[3] && this.active?.tag === match[3].toLowerCase()) {
        events.push({ type: "tag-end", ...this.active });
        this.active = null;
      }
      consumed = index + match[0].length;
    }

    this.buffer = this.buffer.slice(consumed);
    if (!this.active && this.buffer.length > 1024) {
      this.buffer = this.buffer.slice(-1024);
    }
    return events;
  }
}
