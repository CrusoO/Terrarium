import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Box, Button, Chip, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";

const SKIPPED = "Skip — use a sensible default";

type ClarifyAnswersProps = {
  questions: string[];
  disabled?: boolean;
  onSend: (text: string) => void;
};

type ChipOption = { label: string; value: string };

function chipsFor(question: string): { chips: ChipOption[]; multi: boolean } {
  const q = question.toLowerCase();
  if (/page|section/.test(q)) {
    return {
      multi: true,
      chips: [
        { label: "Home", value: "Home" },
        { label: "About", value: "About" },
        { label: "Contact", value: "Contact" },
        { label: "Blog", value: "Blog" },
        { label: "Pricing", value: "Pricing" },
      ],
    };
  }
  if (/purpose|topic|kind of website|genre|type of/.test(q)) {
    return {
      multi: false,
      chips: [
        { label: "Landing page", value: "Landing page" },
        { label: "Portfolio", value: "Portfolio" },
        { label: "Restaurant", value: "Restaurant" },
        { label: "Blog", value: "Blog" },
        { label: "Shop", value: "Small shop" },
      ],
    };
  }
  if (/color|brand|theme|visual|style/.test(q)) {
    return {
      multi: false,
      chips: [
        { label: "Light", value: "Light theme" },
        { label: "Dark", value: "Dark theme" },
        { label: "Maroon / brand", value: "Maroon brand colors" },
      ],
    };
  }
  if (/operat|basic|scientific/.test(q)) {
    return {
      multi: false,
      chips: [
        { label: "Basic + − × ÷", value: "Basic arithmetic" },
        { label: "Scientific", value: "Scientific (trig, logs)" },
        { label: "Percent / tax", value: "Percentage, tax, and tip" },
      ],
    };
  }
  if (/history/.test(q)) {
    return {
      multi: false,
      chips: [
        { label: "Yes, keep history", value: "Yes, keep a history" },
        { label: "No history", value: "No history" },
      ],
    };
  }
  if (/input format|excel|csv|json/.test(q)) {
    return {
      multi: false,
      chips: [
        { label: "Excel", value: "Excel" },
        { label: "CSV", value: "CSV" },
        { label: "JSON", value: "JSON" },
        { label: "Text", value: "Plain text" },
      ],
    };
  }
  if (/download|output/.test(q)) {
    return {
      multi: false,
      chips: [
        { label: "On screen", value: "Show on screen" },
        { label: "Download a file", value: "Download a file" },
        { label: "Both", value: "Show on screen and download" },
      ],
    };
  }
  return { chips: [], multi: false };
}

function splitValues(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ClarifyAnswers({ questions, disabled = false, onSend }: ClarifyAnswersProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [skipped, setSkipped] = useState<boolean[]>(() => questions.map(() => false));
  const inputRef = useRef<HTMLInputElement>(null);

  const last = step >= questions.length - 1;
  const current = questions[step] ?? "";
  const { chips, multi } = chipsFor(current);
  const selected = splitValues(answers[step] ?? "");
  const progress = ((step + 1) / questions.length) * 100;

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  function write(index: number, value: string, markSkipped = false) {
    setAnswers((currentAnswers) =>
      currentAnswers.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
    setSkipped((currentSkipped) =>
      currentSkipped.map((item, itemIndex) => (itemIndex === index ? markSkipped : item))
    );
  }

  function toggleChip(value: string) {
    if (multi) {
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      write(step, next.join(", "));
      return;
    }
    write(step, value);
    goNext(value);
  }

  function goNext(override?: string) {
    const value = (override ?? answers[step] ?? "").trim();
    if (!value && !skipped[step]) {
      return;
    }
    if (last) {
      submit();
      return;
    }
    setStep((currentStep) => currentStep + 1);
  }

  function skipThis() {
    write(step, "", true);
    if (last) {
      submit({ skipIndex: step });
      return;
    }
    setStep((currentStep) => currentStep + 1);
  }

  function compose(extraSkip?: number): string {
    const nextSkipped = skipped.map((item, index) => item || extraSkip === index);
    const nextAnswers = answers;
    const anyTyped = nextAnswers.some((answer, index) => !nextSkipped[index] && answer.trim());
    if (!anyTyped) {
      return "Skip the questions";
    }
    return questions
      .map((question, index) => {
        const answer =
          nextSkipped[index] || !nextAnswers[index]?.trim() ? SKIPPED : nextAnswers[index].trim();
        return `${index + 1}. ${question}\n${answer}`;
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

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      goNext();
    }
  }

  return (
    <Paper variant="outlined" sx={{ mt: 1.5, overflow: "hidden", borderRadius: 3 }}>
      <LinearProgress variant="determinate" value={progress} />
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", px: 1.5, pt: 1.25 }}
      >
        <Typography variant="caption" color="text.secondary">
          Question {step + 1} of {questions.length}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          {questions.map((_, index) => (
            <Box
              key={index}
              component="button"
              type="button"
              aria-label={`Question ${index + 1}`}
              onClick={() => setStep(index)}
              sx={{
                border: 0,
                p: 0,
                cursor: "pointer",
                bgcolor: index <= step ? "primary.main" : "divider",
                opacity: index === step ? 1 : 0.45,
                height: 6,
                width: index === step ? 20 : 8,
                borderRadius: 99,
              }}
            />
          ))}
        </Stack>
      </Stack>

      <Box key={step} sx={{ px: 1.5, py: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
          {current}
        </Typography>
        {chips.length > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 1.5 }}>
            {chips.map((chip) => {
              const on = selected.includes(chip.value);
              return (
                <Chip
                  key={chip.value}
                  label={chip.label}
                  clickable={!disabled}
                  disabled={disabled}
                  color="primary"
                  variant={on ? "filled" : "outlined"}
                  onClick={() => toggleChip(chip.value)}
                />
              );
            })}
          </Stack>
        ) : null}
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          value={skipped[step] ? "" : (answers[step] ?? "")}
          disabled={disabled}
          onChange={(event) => write(step, event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={multi ? "Or type pages…" : "Or type your own answer…"}
          sx={{ mt: 1.5 }}
        />
      </Box>

      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 1.5,
          py: 1,
          bgcolor: "action.hover",
        }}
      >
        <Stack direction="row" spacing={0.5}>
          <Button size="small" disabled={disabled || step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Back
          </Button>
          <Button size="small" disabled={disabled} onClick={skipThis}>
            Skip
          </Button>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" disabled={disabled} onClick={() => submit({ skipAll: true })}>
            Skip all
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={disabled || (!answers[step]?.trim() && !skipped[step] && !last)}
            onClick={() => goNext()}
          >
            {last ? "Send" : "Continue"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
