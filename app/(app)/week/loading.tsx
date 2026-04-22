export default function WeekLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-muted rounded-md" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-muted rounded-md" />
          <div className="h-4 w-28 bg-muted rounded-md" />
          <div className="h-8 w-8 bg-muted rounded-md" />
        </div>
      </div>

      {/* 7-column grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-muted h-24" />
        ))}
      </div>

      {/* Weekly summary */}
      <div className="rounded-xl bg-muted h-16" />

      {/* Link */}
      <div className="h-4 w-36 bg-muted rounded-md mx-auto" />
    </div>
  );
}
