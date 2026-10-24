interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  circle?: boolean;
}

export function Skeleton({ width, height = 12, className = "", circle = false }: SkeletonProps) {
  return (
    <div
      className={[
        "bg-[var(--color-bg-sunken)] animate-[ic-shimmer_1.5s_infinite]",
        circle ? "rounded-full" : "rounded",
        className,
      ].join(" ")}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton circle width={32} height={32} />
      <Skeleton width={140} />
      <Skeleton width={80} />
      <div className="ml-auto">
        <Skeleton width={60} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--color-border-subtle)]">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
