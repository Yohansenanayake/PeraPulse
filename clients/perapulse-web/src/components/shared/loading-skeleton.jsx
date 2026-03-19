export function LoadingSkeleton({ count = 3, className = "" }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-muted" />
              <div className="h-2 w-1/4 rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
            <div className="h-3 w-4/6 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-card p-5 ${className}`}
    >
      <div className="space-y-3">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
        <div className="flex gap-2 mt-4">
          <div className="h-7 w-20 rounded-full bg-muted" />
          <div className="h-7 w-16 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
