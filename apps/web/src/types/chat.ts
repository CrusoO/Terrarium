import type { ClarifyQuestion, SessionEvent } from "@terrarium/contracts";

export type ChatItem =
  | { kind: "user"; id: string; text: string }
  | {
      kind: "assistant";
      id: string;
      text: string;
      questions?: string[];
      questionItems?: ClarifyQuestion[];
      phase?: string;
    }
  | { kind: "thinking"; id: string; label: string }
  | { kind: "heal-exhausted"; id: string; logs: string }
  | { kind: "session-ended"; id: string; logs: string }
  | { kind: "event"; id: string; event: SessionEvent };
