export default function TodayLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-muted rounded-md" />
          <div className="h-4 w-32 bg-muted rounded-md" />
        </div>
        <div className="h-4 w-24 bg-muted rounded-md" />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full" />

      {/* Check list rows */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted" />
        ))}
      </div>

      {/* Metric counters */}
      <div className="flex gap-2 pt-2">
        <div className="flex-1 h-10 rounded-lg bg-muted" />
        <div className="flex-1 h-10 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
