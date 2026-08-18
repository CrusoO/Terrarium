import type { SessionEvent } from "@terrarium/contracts";

export type ChatItem =
  | { kind: "user"; id: string; text: string }
  | { kind: "event"; id: string; event: SessionEvent };
