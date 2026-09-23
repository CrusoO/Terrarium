import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";

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
    <Paper
      variant="outlined"
      sx={{
        mt: 1.75,
        overflow: "hidden",
        borderRadius: "12px",
        borderColor: "divider",
        borderTop: "2px solid",
        borderTopColor: "primary.main",
        bgcolor: "background.paper",
        boxShadow: "none",
      }}
    >
      <Box key={step} sx={{ px: 2, pt: 1.75, pb: 1.5 }}>
        <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 650, display: "block", mb: 0.75 }}>
          Question {step + 1} of {questions.length}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.45 }}>
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
          placeholder="Type your answer..."
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{
            mt: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              bgcolor: "background.paper",
            },
          }}
        />
      </Box>

      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 1.25,
          py: 1,
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" spacing={0.25}>
          <Button
            size="small"
            disabled={disabled || step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Back
          </Button>
          <Button size="small" disabled={disabled} onClick={skipThis} sx={{ color: "primary.main", fontWeight: 600 }}>
            Skip
          </Button>
          <Button
            size="small"
            disabled={disabled}
            onClick={() => submit({ skipAll: true })}
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Skip all
          </Button>
        </Stack>
        <Button
          size="small"
          variant="contained"
          disableElevation
          disabled={disabled}
          onClick={() => goNext()}
          sx={{
            bgcolor: "#17181c",
            color: "#fff",
            borderRadius: "999px",
            px: 2.25,
            minWidth: 96,
            "&:hover": { bgcolor: "#2a2b30" },
            "&.Mui-disabled": { bgcolor: "#e7e5e1", color: "#98a2b3" },
          }}
        >
          {last ? "Send" : "Continue"}
        </Button>
      </Stack>
    </Paper>
  );
}
