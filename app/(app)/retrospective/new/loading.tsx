export default function NewRetrospectiveLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-28 bg-muted rounded-md" />
        <div className="h-4 w-48 bg-muted rounded-md" />
      </div>

      {/* Section: 이번 주 한 것 — 5 fields */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-muted rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="h-4 w-16 bg-muted rounded-md flex-shrink-0" />
              <div className="h-9 flex-1 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Section: 계획 대비 달성도 — 3 fields */}
      <div className="space-y-3">
        <div className="h-4 w-36 bg-muted rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="h-4 w-16 bg-muted rounded-md flex-shrink-0" />
              <div className="h-9 flex-1 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Section: 배운 것 — 3 fields */}
      <div className="space-y-3">
        <div className="h-4 w-28 bg-muted rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="h-4 w-16 bg-muted rounded-md flex-shrink-0" />
              <div className="h-9 flex-1 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Section: 막힌 것 — textarea */}
      <div className="space-y-3">
        <div className="h-4 w-40 bg-muted rounded-md" />
        <div className="h-20 w-full bg-muted rounded-lg" />
      </div>

      {/* Section: 다음 주 목표 — 3 fields */}
      <div className="space-y-3">
        <div className="h-4 w-36 bg-muted rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="h-4 w-16 bg-muted rounded-md flex-shrink-0" />
              <div className="h-9 flex-1 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Section: 컨디션 — 3 fields */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-muted rounded-md" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="h-4 w-16 bg-muted rounded-md flex-shrink-0" />
              <div className="h-9 flex-1 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="h-10 w-full bg-muted rounded-lg" />
    </div>
  );
}
