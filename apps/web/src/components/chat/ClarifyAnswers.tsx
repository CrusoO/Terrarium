import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { Box, Button, IconButton, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import type { ClarifyChoice, ClarifyQuestion } from "@terrarium/contracts";

const SKIPPED = "Skip — use a sensible default";
const MAROON = "var(--tt-accent-fill)";
const BORDER = "var(--tt-line-strong)";
const TRACK = "var(--tt-line)";
const SELECTED_BG = "var(--tt-tint-selected)";
const MUTED = "text.secondary";
const CUSTOM_VALUE = "__custom__";

type ClarifyAnswersProps = {
  questions: string[];
  questionItems?: ClarifyQuestion[];
  disabled?: boolean;
  onSend: (text: string) => void;
};

function fallbackSteps(questions: string[]): ClarifyQuestion[] {
  return questions.map((text) => ({
    text,
    helperText: "Pick one to get started. You can change this anytime.",
    options: [
      "Keep it simple — essentials only",
      "Balanced — useful without extra complexity",
      "Full-featured — include nice extras",
    ],
    dataSource: /\b(upload|file|excel|csv|pdf|data|import|paste)\b/i.test(text),
  }));
}

function normalizeSteps(questions: string[], questionItems?: ClarifyQuestion[]): ClarifyQuestion[] {
  if (questionItems?.length) {
    return questionItems;
  }
  return fallbackSteps(questions);
}

function choicesForStep(step: ClarifyQuestion): ClarifyChoice[] {
  if (step.choices?.length) {
    return step.choices;
  }
  const lines = step.options ?? [];
  const mapped: ClarifyChoice[] = lines.slice(0, 3).map((line) => {
    const parts = line.split(" — ");
    const title = parts[0]?.trim() || line;
    const subtitle = parts.slice(1).join(" — ").trim();
    return { title, subtitle, value: line, variant: "default" as const };
  });
  if (step.dataSource && !step.choices?.length) {
    return [
      {
        title: "Clothing and accessories",
        subtitle: "",
        value: "Clothing and accessories",
        variant: "default",
      },
      {
        title: "Food and groceries",
        subtitle: "",
        value: "Food and groceries",
        variant: "default",
      },
      {
        title: "Office supplies",
        subtitle: "",
        value: "Office supplies",
        variant: "default",
      },
      {
        title: "Handmade or custom items",
        subtitle: "",
        value: "Handmade or custom items",
        variant: "default",
      },
    ];
  }
  return mapped;
}

async function readUploadedFile(file: File): Promise<string> {
  const name = file.name;
  if (/\.(txt|csv)$/i.test(name)) {
    const body = await file.text();
    return `Uploaded ${name} (sample):\n${body.trim().slice(0, 4000)}`;
  }
  return (
    `Uploaded ${name}. Use this file for the app; ` +
    "use example information if the file cannot be read here."
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "1.5px solid",
        borderColor: selected ? "var(--tt-accent-text)" : "var(--tt-line-strong)",
        bgcolor: selected ? "var(--tt-accent-fill)" : "transparent",
        color: selected ? "#fff" : "var(--tt-accent-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {selected ? "✓" : "+"}
    </Box>
  );
}

export function ClarifyAnswers({
  questions,
  questionItems,
  disabled = false,
  onSend,
}: ClarifyAnswersProps) {
  const steps = useMemo(() => normalizeSteps(questions, questionItems), [questions, questionItems]);
  const [step, setStep] = useState(0);
  const [fileAnswers, setFileAnswers] = useState<string[]>(() => steps.map(() => ""));
  const [skipped, setSkipped] = useState<boolean[]>(() => steps.map(() => false));
  const [selectedIndexes, setSelectedIndexes] = useState<number[][]>(() => steps.map(() => []));
  const [selectedValues, setSelectedValues] = useState<string[][]>(() => steps.map(() => []));
  const [customText, setCustomText] = useState<string[]>(() => steps.map(() => ""));
  const [ideaOffset, setIdeaOffset] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const customRef = useRef<HTMLTextAreaElement>(null);
  const radioRefs = useRef<(HTMLDivElement | null)[]>([]);

  const last = step >= steps.length - 1;
  const current = steps[step];
  const choices = useMemo(() => (current ? choicesForStep(current) : []), [current]);
  const displayedChoices = useMemo(() => {
    const customChoice: ClarifyChoice = {
      title: "Custom answer",
      subtitle: "Add text, images, files, or notes",
      value: CUSTOM_VALUE,
      variant: "custom",
    };
    if (!choices.length) return [customChoice];
    const offset = ideaOffset % choices.length;
    return [...choices.slice(offset), ...choices.slice(0, offset)].slice(0, 3).concat(customChoice);
  }, [choices, ideaOffset]);
  const selectedForStep = selectedIndexes[step] ?? [];
  const selectedValueSet = new Set(selectedValues[step] ?? []);
  const allowMultiple = current?.allowMultiple === true;
  const customSelected = selectedValueSet.has(CUSTOM_VALUE);
  const acceptsFiles = customSelected || current?.acceptsFiles === true || current?.dataSource === true;

  const canContinue = useMemo(() => {
    if (skipped[step]) {
      return true;
    }
    const picked = selectedValues[step] ?? [];
    const hasRegularChoice = picked.some((value) => value !== CUSTOM_VALUE);
    const hasCustomContext = Boolean(customText[step]?.trim()) || Boolean(fileAnswers[step]?.trim());
    return (
      hasRegularChoice ||
      hasCustomContext
    );
  }, [step, skipped, selectedValues, customText, fileAnswers]);

  useEffect(() => {
    customRef.current?.blur();
    setIdeaOffset(0);
  }, [step]);

  const markSkipped = useCallback((index: number, skip = false) => {
    setSkipped((prev) => prev.map((item, i) => (i === index ? skip : item)));
  }, []);

  function selectChoice(choiceIndex: number) {
    if (disabled) {
      return;
    }
    setSelectedIndexes((prev) =>
      prev.map((values, i) => {
        if (i !== step) return values;
        if (!allowMultiple) return [choiceIndex];
        return values.includes(choiceIndex)
          ? values.filter((item) => item !== choiceIndex)
          : [...values, choiceIndex];
      }),
    );
    const choice = displayedChoices[choiceIndex];
    if (choice) {
      setSelectedValues((prev) =>
        prev.map((values, i) => {
          if (i !== step) return values;
          if (!allowMultiple) return [choice.value];
          return values.includes(choice.value)
            ? values.filter((item) => item !== choice.value)
            : [...values, choice.value];
        }),
      );
    }
    markSkipped(step, false);
  }

  function compose(extraSkip?: number): string {
    const nextSkipped = skipped.map((item, index) => item || extraSkip === index);
    const answerFor = (index: number): string => {
      const picked = (selectedValues[index] ?? []).filter((value) => value !== CUSTOM_VALUE);
      return [picked.join(", "), customText[index]?.trim(), fileAnswers[index]?.trim()]
        .filter(Boolean)
        .join("\n");
    };
    const anyTyped = steps.some((_, index) => !nextSkipped[index] && answerFor(index).trim());
    if (!anyTyped) {
      return "Skip the questions";
    }
    return steps
      .map((item, index) => {
        const value = answerFor(index).trim();
        const answer = nextSkipped[index] || !value ? SKIPPED : value;
        return `${index + 1}. ${item.text}\n${answer}`;
      })
      .join("\n\n");
  }

  function submit(options?: { skipAll?: boolean; skipIndex?: number }) {
    if (disabled) {
      return;
    }
    if (options?.skipAll) {
      onSend("Skip the questions");
      return;
    }
    onSend(compose(options?.skipIndex));
  }

  function goNext() {
    if (!canContinue && !skipped[step]) {
      return;
    }
    if (last) {
      submit();
      return;
    }
    setStep((s) => s + 1);
  }

  function skipThis() {
    markSkipped(step, true);
    if (last) {
      submit({ skipIndex: step });
      return;
    }
    setStep((s) => s + 1);
  }

  async function ingestFile(file: File) {
    const summary = await readUploadedFile(file);
    setFileAnswers((prev) => prev.map((item, i) => (i === step ? summary : item)));
    markSkipped(step, false);
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      await ingestFile(file);
    }
  }

  async function onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await ingestFile(file);
    }
  }

  function onRadioKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      selectChoice(index);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      const next = Math.min(displayedChoices.length - 1, index + 1);
      selectChoice(next);
      radioRefs.current[next]?.focus();
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      const prev = Math.max(0, index - 1);
      selectChoice(prev);
      radioRefs.current[prev]?.focus();
    }
  }

  const prompt = current?.text ?? "";
  const helper = current?.helperText ?? "Pick one to get started. You can change this anytime.";

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1.75,
        borderRadius: "16px",
        bgcolor: "#fff",
        boxShadow: "0 8px 28px rgba(28, 17, 20, 0.08)",
        p: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: MAROON, whiteSpace: "nowrap" }}>
          Step {step + 1} of {steps.length}
        </Typography>
        <Link
          component="button"
          type="button"
          underline="hover"
          disabled={disabled}
          onClick={() => submit({ skipAll: true })}
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: MAROON,
            whiteSpace: "nowrap",
            minHeight: 44,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          Skip setup
        </Link>
      </Stack>

      <Stack direction="row" spacing="6px" aria-hidden>
        {steps.map((_, index) => (
          <Box
            key={`seg-${index}`}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              bgcolor: index <= step ? MAROON : TRACK,
            }}
          />
        ))}
      </Stack>

      <Box>
        <Typography
          sx={{
            fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            color: "text.primary",
          }}
        >
          {prompt}
        </Typography>
        <Typography sx={{ fontSize: 14, color: MUTED, mt: 0.75, lineHeight: 1.5 }}>
          {helper}
        </Typography>
      </Box>

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "text.secondary",
          }}
        >
          SUGGESTED ANSWERS
        </Typography>
        <Button
          size="small"
          onClick={() => {
            setIdeaOffset((value) => value + 1);
            setSelectedIndexes((prev) => prev.map((items, i) => (i === step ? [] : items)));
            setSelectedValues((prev) => prev.map((items, i) => (i === step ? [] : items)));
          }}
          sx={{ color: "var(--tt-accent-text)", minHeight: 44, textTransform: "none", fontWeight: 600 }}
        >
          More ideas
        </Button>
      </Stack>

      <Box role={allowMultiple ? "group" : "radiogroup"} aria-label={prompt}>
        <Stack spacing={1}>
          {displayedChoices.map((choice, index) => {
            const selected = selectedValueSet.has(choice.value);
            return (
              <Box
                key={`${choice.title}-${index}`}
                ref={(node: HTMLDivElement | null) => {
                  radioRefs.current[index] = node;
                }}
                role={allowMultiple ? "checkbox" : "radio"}
                tabIndex={selected || (selectedForStep.length === 0 && index === 0) ? 0 : -1}
                aria-checked={selected}
                onKeyDown={(event) => onRadioKeyDown(event, index)}
                onClick={() => selectChoice(index)}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  width: "100%",
                  minHeight: 58,
                  px: "14px",
                  py: "10px",
                  borderRadius: "12px",
                  border: "1.5px solid",
                  borderColor: selected ? "var(--tt-accent-text)" : BORDER,
                  bgcolor: selected ? SELECTED_BG : "var(--tt-surface)",
                  cursor: disabled ? "not-allowed" : "pointer",
                  boxSizing: "border-box",
                  outline: "none",
                  "&:focus-visible": {
                    boxShadow: "0 0 0 3px color-mix(in srgb, var(--tt-accent-text) 26%, transparent)",
                  },
                }}
              >
                <RadioDot selected={selected} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>
                    {choice.title}
                  </Typography>
                  {choice.subtitle ? (
                    <Typography sx={{ fontSize: 13, color: MUTED, mt: 0.35, lineHeight: 1.35 }}>
                      {choice.subtitle}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {customSelected ? (
        <Stack spacing={1.5}>
          <Box sx={{ position: "relative" }} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
            <TextField
              inputRef={customRef}
              fullWidth
              multiline
              minRows={3}
              label="Add context for Terra"
              placeholder={current?.inputPlaceholder ?? "Type details, paste notes, or describe what to build"}
              value={customText[step] ?? ""}
              disabled={disabled}
              onChange={(event) => {
                const value = event.target.value;
                setCustomText((prev) => prev.map((item, i) => (i === step ? value : item)));
                markSkipped(step, false);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "12px", pr: acceptsFiles ? 6 : undefined },
                "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: MAROON },
              }}
            />
            {acceptsFiles ? (
              <>
                <IconButton
                  aria-label="Attach file or image"
                  disabled={disabled}
                  onClick={() => fileRef.current?.click()}
                  sx={{
                    position: "absolute",
                    right: 10,
                    bottom: 10,
                    width: 38,
                    height: 38,
                    color: MAROON,
                    bgcolor: SELECTED_BG,
                    border: "1px solid",
                    borderColor: "var(--tt-line)",
                    "&:hover": { bgcolor: "var(--tt-tint)" },
                  }}
                >
                  <CloudUploadOutlinedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept=".csv,.txt,.pdf,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
                onChange={onFileChange}
              />
              </>
            ) : null}
          </Box>
          {fileAnswers[step]?.trim() ? (
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              File ready — continue when you are done.
            </Typography>
          ) : null}
        </Stack>
      ) : null}

      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid",
          borderColor: TRACK,
          pt: 2,
          flexWrap: "nowrap",
          gap: 1,
        }}
      >
        <Button
          disabled={disabled || step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          sx={{
            minHeight: 44,
            color: MAROON,
            textTransform: "none",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Back
        </Button>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "nowrap" }}>
          <Button
            disabled={disabled}
            onClick={skipThis}
            sx={{
              minHeight: 44,
              color: MUTED,
              textTransform: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Skip
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={disabled || !canContinue}
            onClick={goNext}
            sx={{
              minHeight: 44,
              px: 3,
              borderRadius: "999px",
              bgcolor: MAROON,
              textTransform: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#641932" },
              "&.Mui-disabled": { bgcolor: TRACK, color: "text.disabled" },
            }}
          >
            {last ? "Send" : `Continue${selectedValues[step]?.length > 1 ? ` (${selectedValues[step].length})` : ""}`}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
