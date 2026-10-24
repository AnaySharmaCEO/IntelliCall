import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface ErrorInlineProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorInline: React.FC<ErrorInlineProps> = ({ message, onRetry }) => {
  return (
    <div className="flex items-center justify-between bg-[var(--color-error-bg)] border border-[var(--color-error)]/20 text-[var(--color-error)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[12px] font-medium">
      <div className="flex items-center gap-2">
        <AlertCircle size={15} className="shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-bold text-[12px] text-[var(--color-error)] hover:underline ml-4 cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorInline;
