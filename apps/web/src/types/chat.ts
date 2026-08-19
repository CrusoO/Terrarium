import type { SessionEvent } from "@terrarium/contracts";

export type ChatItem =
  | { kind: "user"; id: string; text: string }
  | { kind: "assistant"; id: string; text: string; questions?: string[]; phase?: string }
  | { kind: "thinking"; id: string; label: string }
  | { kind: "event"; id: string; event: SessionEvent };
