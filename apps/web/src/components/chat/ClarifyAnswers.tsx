import { useState, type FormEvent, type KeyboardEvent } from "react";

const SKIPPED = "Skip — use a sensible default";

type ClarifyAnswersProps = {
  questions: string[];
  disabled?: boolean;
  onSend: (text: string) => void;
};

export function ClarifyAnswers({ questions, disabled = false, onSend }: ClarifyAnswersProps) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [skipped, setSkipped] = useState<boolean[]>(() => questions.map(() => false));

  const canSend = answers.some((answer, index) => skipped[index] || answer.trim().length > 0);
  const allSkipped = skipped.every(Boolean);

  function setAnswer(index: number, value: string) {
    setAnswers((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
    if (value.trim()) {
      setSkipped((current) => current.map((item, itemIndex) => (itemIndex === index ? false : item)));
    }
  }

  function skipOne(index: number) {
    setSkipped((current) => current.map((item, itemIndex) => (itemIndex === index ? !item : item)));
    setAnswers((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? "" : item))
    );
  }

  function composeMessage(): string {
    if (allSkipped || skipped.every((item, index) => item || !answers[index]?.trim())) {
      const anyTyped = answers.some((answer) => answer.trim().length > 0);
      if (!anyTyped) {
        return "Skip the questions";
      }
    }
    return questions
      .map((question, index) => {
        if (skipped[index]) {
          return `${index + 1}. ${question}\n${SKIPPED}`;
        }
        const answer = answers[index]?.trim();
        if (!answer) {
          return `${index + 1}. ${question}\n${SKIPPED}`;
        }
        return `${index + 1}. ${question}\n${answer}`;
      })
      .join("\n\n");
  }

  function submit(skipAll = false) {
    if (disabled) {
      return;
    }
    if (skipAll) {
      onSend("Skip the questions");
      return;
    }
    if (!canSend) {
      return;
    }
    onSend(composeMessage());
  }

  function onFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={onFormSubmit} className="mt-2 rounded-lg bg-maroon-soft p-2">
      <ol className="space-y-2.5">
        {questions.map((question, index) => (
          <li key={`${question}-${index}`} className="space-y-1">
            <p className="flex gap-2 text-[13px] text-maroon-dark">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-maroon text-[11px] font-semibold text-white">
                {index + 1}
              </span>
              <span>{question}</span>
            </p>
            <div className="ml-7 flex items-center gap-1.5">
              <input
                type="text"
                value={skipped[index] ? "" : (answers[index] ?? "")}
                disabled={disabled || skipped[index]}
                onChange={(event) => setAnswer(index, event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={skipped[index] ? "Skipped" : "Type your answer"}
                className="min-w-0 flex-1 rounded-md border border-line bg-white px-2 py-1.5 text-[13px] text-ink outline-none placeholder:text-muted focus:border-maroon disabled:bg-canvas disabled:opacity-70"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => skipOne(index)}
                className={
                  skipped[index]
                    ? "shrink-0 rounded-md bg-maroon px-2 py-1.5 text-[11px] font-medium text-white"
                    : "shrink-0 rounded-md border border-line bg-white px-2 py-1.5 text-[11px] font-medium text-muted hover:border-maroon hover:text-maroon"
                }
              >
                {skipped[index] ? "Undo" : "Skip"}
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex items-center justify-end gap-2 pl-7">
        <button
          type="button"
          disabled={disabled}
          onClick={() => submit(true)}
          className="rounded-lg border border-line bg-white px-2.5 py-1 text-[12px] font-medium text-muted hover:border-maroon hover:text-maroon disabled:opacity-50"
        >
          Skip all
        </button>
        <button
          type="submit"
          disabled={disabled || !canSend}
          className="rounded-lg bg-maroon px-2.5 py-1 text-[12px] font-medium text-white hover:bg-maroon-dark disabled:opacity-50"
        >
          Send answers
        </button>
      </div>
    </form>
  );
}
