import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Box, Button, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";

const SKIPPED = "Skip — use a sensible default";

type ClarifyAnswersProps = {
  questions: string[];
  disabled?: boolean;
  onSend: (text: string) => void;
};

export function ClarifyAnswers({ questions, disabled = false, onSend }: ClarifyAnswersProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [skipped, setSkipped] = useState<boolean[]>(() => questions.map(() => false));
  const inputRef = useRef<HTMLInputElement>(null);

  const last = step >= questions.length - 1;
  const current = questions[step] ?? "";
  const filled = Boolean(answers[step]?.trim() || skipped[step]);
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

  function goNext() {
    const value = (answers[step] ?? "").trim();
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
    const anyTyped = answers.some((answer, index) => !nextSkipped[index] && answer.trim());
    if (!anyTyped) {
      return "Skip the questions";
    }
    return questions
      .map((question, index) => {
        const answer =
          nextSkipped[index] || !answers[index]?.trim() ? SKIPPED : answers[index].trim();
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
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          label="Your answer"
          value={skipped[step] ? "" : (answers[step] ?? "")}
          disabled={disabled}
          onChange={(event) => write(step, event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your answer…"
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
            disabled={disabled || (!filled && !last)}
            onClick={() => goNext()}
          >
            {last ? "Send" : "Continue"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
