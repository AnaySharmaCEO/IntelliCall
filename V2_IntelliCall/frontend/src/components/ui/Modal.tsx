import React, { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizeStyles = {
  sm: 'max-w-[480px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[900px]',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'relative w-full rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)]',
          'shadow-[var(--shadow-lg)] border border-[var(--color-border-subtle)]',
          'animate-slide-up flex flex-col max-h-[90vh] overflow-hidden',
          sizeStyles[size]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] shrink-0">
          <h2 id="modal-title" className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
