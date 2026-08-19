type ThinkingIndicatorProps = {
  label?: string;
};

export function ThinkingIndicator({ label = "Thinking" }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 py-0.5" role="status" aria-live="polite">
      <span className="thinking-sparkle" aria-hidden="true">
        <svg viewBox="0 0 16 16" className="h-4 w-4">
          <path
            fill="currentColor"
            d="M8 1.2 9.1 5.3 13.2 6.4 9.1 7.5 8 11.6 6.9 7.5 2.8 6.4 6.9 5.3z"
          />
        </svg>
      </span>
      <span className="thinking-shimmer text-sm font-medium">{label}</span>
      <span className="thinking-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
