import React from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width, height = 14, className, circle = false }) => {
  return (
    <div
      className={cn(
        'bg-[var(--color-bg-sunken)] animate-shimmer relative overflow-hidden',
        circle ? 'rounded-full' : 'rounded-[var(--radius-sm)]',
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

export const SkeletonRow: React.FC = () => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
      <Skeleton circle width={32} height={32} />
      <Skeleton width={140} />
      <Skeleton width={80} />
      <div className="ml-auto">
        <Skeleton width={60} />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="divide-y divide-[var(--color-border-subtle)] w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
};

export default Skeleton;
