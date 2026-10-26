import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import { Box, Button, Collapse, Link, Stack, Typography } from "@mui/material";
import { useState } from "react";
import type { ChatItem, KnowledgeAnswer, KnowledgeReading, KnowledgeSource, KnowledgeStep, KnowledgeVerdict } from "../../types/chat";

const ACCENT = "#6e1429";
const MONO = { fontFamily: "ui-monospace, monospace", fontSize: "0.68rem" } as const;
const SOURCES: { id: KnowledgeSource; label: string; badge: string; color: string; queryLabel: string }[] = [
  { id: "confluence", label: "Confluence", badge: "C", color: "#1868db", queryLabel: "Search" },
  { id: "jira", label: "Jira board", badge: "J", color: "#2684ff", queryLabel: "Search" },
  { id: "mail", label: "Mail", badge: "M", color: "#0f6cbd", queryLabel: "Search" },
];

type KnowledgeItem = Extract<ChatItem, { kind: "knowledge" }>;

function stepFor(steps: KnowledgeStep[], source: KnowledgeSource, stage: KnowledgeStep["stage"]) {
  return steps.find((step) => step.source === source && step.stage === stage);
}

function SourceBlock({ steps, source }: { steps: KnowledgeStep[]; source: (typeof SOURCES)[number] }) {
  const [showRaw, setShowRaw] = useState(false);
  const query = stepFor(steps, source.id, "query");
  const results = stepFor(steps, source.id, "results");
  const extracted = stepFor(steps, source.id, "extracted");
  if (!query) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", opacity: 0.45 }}>
        <Badge source={source} />
        <Typography variant="caption">{source.label} — waiting</Typography>
      </Stack>
    );
  }
  const facts = extracted?.facts ?? [];
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Badge source={source} />
        <Typography variant="caption" sx={{ fontWeight: 700, flex: 1 }}>
          {source.label}
        </Typography>
        {extracted ? (
          <CheckRoundedIcon sx={{ fontSize: 15, color: "success.main" }} />
        ) : (
          <span className="agent-step-pulse" />
        )}
      </Stack>
      <Box sx={{ pl: 3.5, mt: 0.4 }}>
        <Typography variant="caption" component="div" color="text.secondary">
          {source.queryLabel}:{" "}
          <Box component="span" sx={MONO}>
            {query.query}
          </Box>
        </Typography>
        {query.mcp ? (
          <Typography variant="caption" component="div" color="text.secondary" sx={MONO}>
            via {query.mcp.server} · {query.mcp.tool}
          </Typography>
        ) : null}
        {results ? (
          <>
            <Typography variant="caption" component="div" sx={{ mt: 0.5, fontWeight: 600 }}>
              {results.total ? `Found ${results.total}` : "Nothing found"}
            </Typography>
            {(results.hits ?? []).map((hit) => (
              <Typography key={hit.id} variant="caption" component="div" color="text.secondary" noWrap title={hit.meta}>
                ·{" "}
                <Link href={hit.url} target="_blank" rel="noreferrer" underline="hover" color="inherit">
                  {hit.title}
                </Link>{" "}
                <Box component="span" sx={{ opacity: 0.7 }}>
                  ({hit.meta})
                </Box>
              </Typography>
            ))}
          </>
        ) : (
          <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: 0.5 }}>
            Searching…
          </Typography>
        )}
        {extracted ? (
          <>
            <Typography variant="caption" component="div" sx={{ mt: 0.5, fontWeight: 600 }}>
              {facts.length ? `Requirements read (${facts.length})` : "No requirements read"}
            </Typography>
            {facts.map((fact, index) => (
              <Typography key={`${fact.ref}-${index}`} variant="caption" component="div" sx={{ lineHeight: 1.45 }}>
                • {fact.text}{" "}
                <Box component="span" sx={{ color: "text.secondary" }}>
                  — {fact.ref}
                </Box>
              </Typography>
            ))}
            {(extracted.skipped ?? []).map((note) => (
              <Typography key={note} variant="caption" component="div" color="warning.dark">
                ⚠ {note}
              </Typography>
            ))}
          </>
        ) : null}
        {results?.raw ? (
          <>
            <Button
              size="small"
              onClick={() => setShowRaw((current) => !current)}
              endIcon={<ExpandMoreRoundedIcon sx={{ transform: showRaw ? "rotate(180deg)" : "none" }} />}
              sx={{ textTransform: "none", color: "text.secondary", fontSize: "0.68rem", px: 0, mt: 0.25 }}
            >
              {showRaw ? "Hide" : "Show"} connector response
            </Button>
            <Collapse in={showRaw} unmountOnExit>
              <Box
                component="pre"
                sx={{ ...MONO, m: 0, p: 1, maxHeight: 220, overflow: "auto", bgcolor: "#f6f7f9", borderRadius: 1.5, border: 1, borderColor: "divider" }}
              >
                {JSON.stringify({ request: query.mcp, response: results.raw }, null, 2)}
              </Box>
            </Collapse>
          </>
        ) : null}
      </Box>
    </Box>
  );
}

const VERDICT_TONE: Record<KnowledgeVerdict, { label: string; color: string; bg: string }> = {
  fits: { label: "Fits", color: "#1b5e20", bg: "rgba(46, 125, 50, 0.12)" },
  yes: { label: "Yes", color: "#1b5e20", bg: "rgba(46, 125, 50, 0.12)" },
  check: { label: "Needs a look", color: "#e65100", bg: "rgba(237, 108, 2, 0.12)" },
  unknown: { label: "Not enough", color: "#5f6368", bg: "rgba(0, 0, 0, 0.06)" },
  no: { label: "Not found", color: "#5f6368", bg: "rgba(0, 0, 0, 0.06)" },
};

function AnswerBlock({ label, answer }: { label: string; answer: KnowledgeAnswer }) {
  const tone = VERDICT_TONE[answer.verdict];
  return (
    <Box>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Box sx={{ px: 0.7, py: 0.1, borderRadius: 1, bgcolor: tone.bg, color: tone.color, fontSize: "0.68rem", fontWeight: 700 }}>
          {tone.label}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="caption" component="div" sx={{ mt: 0.35, lineHeight: 1.45 }}>
        {answer.detail}
      </Typography>
      {answer.from.length ? (
        <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: 0.25 }}>
          From {answer.from.join(" · ")}
        </Typography>
      ) : null}
    </Box>
  );
}

function ReadingPanel({ reading }: { reading: KnowledgeReading }) {
  return (
    <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, border: 1, borderColor: "divider", bgcolor: "#fbfbfc" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
        What Brownie learned
      </Typography>
      <Stack spacing={1.1}>
        <AnswerBlock label="Secure way of building" answer={reading.secure} />
        <AnswerBlock label="Same need used before" answer={reading.seenBefore} />
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Coding habits that apply
          </Typography>
          {reading.practices.length ? (
            reading.practices.map((item) => (
              <Typography key={item.habit} variant="caption" component="div" sx={{ lineHeight: 1.45 }}>
                • {item.habit}{" "}
                <Box component="span" sx={{ color: "text.secondary" }}>
                  — {item.from}
                </Box>
              </Typography>
            ))
          ) : (
            <Typography variant="caption" component="div" color="text.secondary">
              No company habit was found for this request.
            </Typography>
          )}
        </Box>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Where a company usually keeps this
          </Typography>
          {reading.whereKept.map((item) => (
            <Typography key={item.place} variant="caption" component="div" sx={{ lineHeight: 1.45 }}>
              <Box component="span" sx={{ fontWeight: 650 }}>
                {item.place}.
              </Box>{" "}
              {item.holds}
            </Typography>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}

function Badge({ source }: { source: (typeof SOURCES)[number] }) {
  return (
    <Box
      sx={{ width: 20, height: 20, borderRadius: "6px", bgcolor: source.color, color: "#fff", display: "grid", placeItems: "center", fontSize: "0.68rem", fontWeight: 700 }}
    >
      {source.badge}
    </Box>
  );
}

export function BrownieKnowledgeStep({ item }: { item: KnowledgeItem }) {
  const done = item.steps.find((step) => step.stage === "done");
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Box sx={{ width: 22, height: 22, borderRadius: "7px", bgcolor: ACCENT, color: "#fff", display: "grid", placeItems: "center" }}>
          <TravelExploreRoundedIcon sx={{ fontSize: 14 }} />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 650, flex: 1 }}>
          Brownie is reading project knowledge
        </Typography>
        <Typography variant="caption" sx={{ px: 0.75, py: 0.1, borderRadius: 1, bgcolor: "rgba(237, 108, 2, 0.1)", color: "warning.dark", fontWeight: 600 }}>
          connectors
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
        {done
          ? `Found ${done.factCount ?? 0} requirements. They are reference only, and they decide the three answers below.`
          : "Checking the written rules, earlier requirements, and agreed decisions before choosing the shape of the app."}
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
        {SOURCES.map((source) => (
          <SourceBlock key={source.id} steps={item.steps} source={source} />
        ))}
      </Stack>
      {done?.reading ? <ReadingPanel reading={done.reading} /> : null}
    </Box>
  );
}
