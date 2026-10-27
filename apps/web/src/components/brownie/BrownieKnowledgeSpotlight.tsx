import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ChatItem, KnowledgeSource, KnowledgeStep } from "../../types/chat";

type KnowledgeItem = Extract<ChatItem, { kind: "knowledge" }>;

const SOURCES: { id: KnowledgeSource; label: string; idle: string; color: string }[] = [
  { id: "jira", label: "Jira", idle: "What was asked for before", color: "#2b7fe0" },
  { id: "confluence", label: "Confluence", idle: "Written rules and decisions", color: "#1868db" },
  { id: "mail", label: "Mail", idle: "Sign-offs and approvals", color: "#0f6cbd" },
];

const STAGE_LABEL: Record<string, string> = {
  query: "Searching",
  results: "Reading the results",
  extracted: "Understanding what it means",
};

function rowFor(steps: KnowledgeStep[], source: KnowledgeSource) {
  const mine = steps.filter((step) => step.source === source);
  if (!mine.length) {
    return { state: "waiting" as const, step: undefined as KnowledgeStep | undefined };
  }
  const last = mine[mine.length - 1];
  return { state: (last.stage === "extracted" ? "done" : "active") as const, step: last };
}

function rowDetail(source: (typeof SOURCES)[number], state: "waiting" | "active" | "done", step?: KnowledgeStep) {
  if (state === "waiting") return source.idle;
  if (step?.stage === "query") return `${STAGE_LABEL.query} · ${step.query ?? ""}`;
  if (step?.stage === "results") return `Found ${step.total ?? 0} item${step.total === 1 ? "" : "s"}`;
  if (step?.stage === "extracted") {
    const count = step.facts?.length ?? 0;
    return `Read ${count} requirement${count === 1 ? "" : "s"}`;
  }
  return source.idle;
}

/**
 * A big, center-of-screen "Brownie is thinking" moment that lights up while the knowledge
 * connectors (Jira, Confluence, mail) are being searched, then fades itself out once the
 * search finishes so the normal chat — already scrolled to the next step — shows through.
 * Everything here reflects the same connector record as the inline chat;
 * this is a presentation layer only, not a second source of truth.
 */
export function BrownieKnowledgeSpotlight({ item }: { item?: KnowledgeItem }) {
  const [hidden, setHidden] = useState(true);
  const [closing, setClosing] = useState(false);
  const shownIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!item) return;
    if (shownIdRef.current !== item.id) {
      shownIdRef.current = item.id;
      setHidden(false);
      setClosing(false);
    }
  }, [item]);

  useEffect(() => {
    if (!item?.done || closing) return;
    const holdTimer = window.setTimeout(() => setClosing(true), 2400);
    return () => window.clearTimeout(holdTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.done, item?.id]);

  useEffect(() => {
    if (!closing) return;
    const hideTimer = window.setTimeout(() => setHidden(true), 380);
    return () => window.clearTimeout(hideTimer);
  }, [closing]);

  if (!item || hidden) return null;

  const doneStep = item.steps.find((step) => step.stage === "done");
  const activeSource = item.steps[item.steps.length - 1]?.source;
  const stageWeight: Record<string, number> = { query: 1, results: 1, extracted: 1 };
  const totalBeats = SOURCES.length * 3;
  const completedBeats = item.steps.filter((step) => stageWeight[step.stage]).length;
  const progress = item.done ? 100 : Math.min(96, Math.round((completedBeats / totalBeats) * 100));

  return (
    <Box
      className={`brownie-spotlight-backdrop ${closing ? "is-closing" : "is-opening"}`}
      role="status"
      aria-live="polite"
    >
      <Box className="brownie-spotlight-card">
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box className="brownie-spotlight-badge">
            <TravelExploreRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.25 }}>
              {item.done ? "Brownie finished reading" : "Brownie is thinking…"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {item.done
                ? `Found ${doneStep?.factCount ?? 0} requirement${doneStep?.factCount === 1 ? "" : "s"} across Jira, Confluence, and mail.`
                : "Checking what the company already decided before writing a single line of code."}
            </Typography>
          </Box>
          <Box className="brownie-spotlight-pill">company knowledge</Box>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={progress}
          className="brownie-spotlight-progress"
          sx={{ mt: 2 }}
        />

        <Stack spacing={1} sx={{ mt: 2 }}>
          {SOURCES.map((source) => {
            const { state, step } = rowFor(item.steps, source.id);
            const active = state === "active" && activeSource === source.id;
            return (
              <Box
                key={source.id}
                className={`brownie-spotlight-row ${active ? "is-active" : ""} ${state === "done" ? "is-done" : ""}`}
              >
                <Box
                  className="brownie-spotlight-dot"
                  style={{ "--dot-color": source.color } as CSSProperties}
                >
                  {state === "done" ? <CheckRoundedIcon sx={{ fontSize: 15 }} /> : null}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {source.label}
                    </Typography>
                    {active ? <span className="brownie-spotlight-cursor" /> : null}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" component="div" noWrap>
                    {rowDetail(source, state, step)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 2.25, textAlign: "center" }}
        >
          Reading Jira, Confluence, and mail for this project.
        </Typography>
      </Box>
    </Box>
  );
}
