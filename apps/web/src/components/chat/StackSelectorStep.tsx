import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { ClarifyChoice, ClarifyQuestion } from "@terrarium/contracts";

export type StackSelection = {
  frontendStack: string;
  backendNeed: "auto" | "yes" | "no";
  backendStack: string;
};

const BACKEND_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  react: [
    { value: "none", label: "Frontend only" },
    { value: "node-express", label: "+ Node / Express backend" },
  ],
  angular: [
    { value: "none", label: "Frontend only" },
    { value: "angular-express", label: "+ Node / Express backend" },
  ],
  sapui5: [
    { value: "none", label: "Frontend only" },
    { value: "sap-cap", label: "+ SAP CAP backend" },
  ],
  custom: [{ value: "none", label: "Frontend only" }],
};

const MAROON = "var(--tt-accent-fill)";
const BORDER = "var(--tt-line-strong)";
const SELECTED_BG = "var(--tt-tint-selected)";
const MUTED = "text.secondary";

type StackSelectorStepProps = {
  step: ClarifyQuestion;
  disabled?: boolean;
  onSelect: (jsonValue: string, displayLabel: string) => void;
};

function getRecommended(choices: ClarifyChoice[]): string {
  return choices.find((c) => c.recommended)?.value ?? choices[0]?.value ?? "react";
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

export function StackSelectorStep({ step, disabled = false, onSelect }: StackSelectorStepProps) {
  const choices = step.choices ?? [];
  const recommended = getRecommended(choices);

  const [frontendStack, setFrontendStack] = useState(recommended);
  const [backendStack, setBackendStack] = useState("none");

  function emit(fe: string, be: string) {
    const json = JSON.stringify({ frontendStack: fe, backendNeed: "auto", backendStack: be });
    const frontLabel = choices.find((c) => c.value === fe)?.title ?? fe;
    const beLabel =
      (BACKEND_OPTIONS[fe] ?? BACKEND_OPTIONS["react"]!).find((o) => o.value === be)?.label ?? be;
    onSelect(json, `${frontLabel} — ${beLabel}`);
  }

  // Emit default on mount so ClarifyAnswers always has an initial value
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { emit(frontendStack, backendStack); }, []);

  function handleFrontend(value: string) {
    setFrontendStack(value);
    setBackendStack("none");
    emit(value, "none");
  }

  function handleBackend(value: string) {
    setBackendStack(value);
    emit(frontendStack, value);
  }

  const backendOptions = BACKEND_OPTIONS[frontendStack] ?? BACKEND_OPTIONS["react"]!;
  const isUnsupported =
    frontendStack === "angular" || frontendStack === "sapui5" || frontendStack === "custom";
  const choiceTitle = choices.find((c) => c.value === frontendStack)?.title ?? frontendStack;

  return (
    <Stack spacing={2.5}>
      {/* Frontend radio list */}
      <Stack spacing={1} role="radiogroup" aria-label={step.text}>
        {choices.map((choice) => {
          const selected = choice.value === frontendStack;
          return (
            <Box
              key={choice.value}
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => !disabled && handleFrontend(choice.value)}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !disabled) handleFrontend(choice.value);
              }}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                px: "14px",
                py: "10px",
                borderRadius: "12px",
                border: "1.5px solid",
                borderColor: selected ? "var(--tt-accent-text)" : BORDER,
                bgcolor: selected ? SELECTED_BG : "var(--tt-surface)",
                cursor: disabled ? "not-allowed" : "pointer",
                outline: "none",
                "&:focus-visible": {
                  boxShadow: "0 0 0 3px color-mix(in srgb, var(--tt-accent-text) 26%, transparent)",
                },
              }}
            >
              <RadioDot selected={selected} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>
                    {choice.title}
                  </Typography>
                  {choice.recommended ? (
                    <Chip
                      label="Recommended"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 11,
                        fontWeight: 600,
                        bgcolor: MAROON,
                        color: "#fff",
                        borderRadius: "999px",
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  ) : null}
                </Stack>
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

      {/* Backend dropdown — hidden for custom */}
      {frontendStack !== "custom" ? (
        <FormControl fullWidth size="small">
          <InputLabel>Backend</InputLabel>
          <Select
            label="Backend"
            value={backendStack}
            disabled={disabled}
            onChange={(e) => handleBackend(e.target.value)}
            sx={{ borderRadius: "12px" }}
          >
            {backendOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}

      {/* Unsupported stack warning */}
      {isUnsupported ? (
        <Box
          sx={{
            p: 2,
            borderRadius: "12px",
            bgcolor: "#fff8e1",
            border: "1.5px solid #f59e0b",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#92400e", mb: 0.5 }}>
            {frontendStack === "custom" ? "Custom stack" : `${choiceTitle} support`}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>
            {frontendStack === "custom"
              ? "Custom stacks are not yet supported. You can continue — Terra will show an error before building starts and you can change your selection."
              : `${choiceTitle} support is coming soon. You can continue — Terra will confirm before building starts.`}
          </Typography>
        </Box>
      ) : null}
    </Stack>
  );
}
