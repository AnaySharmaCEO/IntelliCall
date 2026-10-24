interface ErrorInlineProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorInline({ message, onRetry }: ErrorInlineProps) {
  return (
    <div className="flex items-center justify-between bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-sm)] px-3 py-2.5 text-[12px] font-medium">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-bold text-[12px] text-[var(--color-error)] hover:underline ml-4"
        >
          Retry
        </button>
      )}
    </div>
  );
}
