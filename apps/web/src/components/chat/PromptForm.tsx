import type { FormEvent } from "react";
import { DEV_USER } from "@terrarium/contracts";

type PromptFormProps = {
  prompt: string;
  busy: boolean;
  status: string | null;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PromptForm({ prompt, busy, status, onPromptChange, onSubmit }: PromptFormProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-line p-4">
      <label htmlFor="prompt" className="sr-only">
        Ask for changes
      </label>
      <textarea
        id="prompt"
        rows={3}
        value={prompt}
        onChange={(change) => onPromptChange(change.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Hi, or describe a tool — I’ll ask a few questions first…"
        className="w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-maroon"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-muted">actor: {DEV_USER}</p>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-maroon px-3 py-1.5 text-sm font-medium text-white hover:bg-maroon-dark disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
      {status ? <p className="mt-2 text-xs text-maroon">{status}</p> : null}
    </form>
  );
}
