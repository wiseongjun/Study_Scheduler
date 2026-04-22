export default function MonthlyLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-24 bg-muted rounded-md" />
        <div className="h-4 w-36 bg-muted rounded-md" />
      </div>

      {/* Category 1: 과제 진행 — 2 items */}
      <div className="space-y-2">
        <div className="h-4 w-20 bg-muted rounded-md" />
        <div className="space-y-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      {/* Category 2: 공개 산출물 — 2 items */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded-md" />
        <div className="space-y-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      {/* Category 3: 기초 체력 — 3 items */}
      <div className="space-y-2">
        <div className="h-4 w-20 bg-muted rounded-md" />
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      {/* Category 4: 루틴 자체 — 3 items */}
      <div className="space-y-2">
        <div className="h-4 w-20 bg-muted rounded-md" />
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      {/* Notes textarea */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted rounded-md" />
        <div className="h-24 w-full bg-muted rounded-lg" />
      </div>

      {/* Submit button */}
      <div className="h-10 w-full bg-muted rounded-lg" />
    </div>
  );
}
