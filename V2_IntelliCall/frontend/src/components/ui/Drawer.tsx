import React, { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { X } from 'lucide-react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
  footer?: ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  children,
  width = 'max-w-[540px]',
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
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs animate-fade-in" aria-modal="true" role="dialog">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'relative ml-auto w-full h-full flex flex-col',
          'bg-[var(--color-bg-elevated)] border-l border-[var(--color-border-subtle)]',
          'shadow-[var(--shadow-lg)] animate-slide-in',
          width
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] shrink-0">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;
