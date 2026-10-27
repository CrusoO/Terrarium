import type { ClarifyQuestion, SessionEvent } from "@terrarium/contracts";
import type { BrownieProvenance, BrownieRecommendation } from "../api/brownie";

export type KnowledgeSource = "confluence" | "jira" | "mail";

export type KnowledgeHit = { id: string; title: string; meta: string; url: string };

export type KnowledgeFact = { text: string; source: KnowledgeSource; ref: string; url: string };

export type KnowledgeVerdict = "fits" | "check" | "unknown" | "yes" | "no";

export type KnowledgeAnswer = {
  verdict: KnowledgeVerdict;
  title: string;
  detail: string;
  from: string[];
};

export type KnowledgeReading = {
  secure: KnowledgeAnswer;
  seenBefore: KnowledgeAnswer;
  practices: { habit: string; from: string }[];
  whereKept: { place: string; holds: string }[];
};

export type KnowledgeStep = {
  stage: "started" | "query" | "results" | "extracted" | "done";
  source?: KnowledgeSource;
  label?: string;
  query?: string;
  mcp?: { server: string; tool: string; arguments: Record<string, unknown> };
  total?: number;
  hits?: KnowledgeHit[];
  raw?: unknown;
  facts?: KnowledgeFact[];
  skipped?: string[];
  calls?: number;
  factCount?: number;
  reading?: KnowledgeReading;
};

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
  | { kind: "event"; id: string; event: SessionEvent }
  | { kind: "knowledge"; id: string; steps: KnowledgeStep[]; done: boolean }
  | {
      kind: "brownie";
      id: string;
      prompt: string;
      stack?: string;
      backendStack?: string;
      reuseSupported: boolean;
      status: "review" | "submitted" | "applied" | "superseded";
      appliedAssetIds?: string[];
      ignoredAssetIds?: string[];
      appliedFiles?: string[];
      provenance?: BrownieProvenance[];
      ignored?: { assetId: string; reason: string }[];
      recommendation?: BrownieRecommendation;
    };
