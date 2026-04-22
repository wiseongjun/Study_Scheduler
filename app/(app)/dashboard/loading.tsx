export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Phase card */}
      <div className="rounded-xl border bg-muted p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-16 bg-muted/70 rounded-md" />
            <div className="h-4 w-32 bg-muted/70 rounded-md" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-4 w-12 bg-muted/70 rounded-md ml-auto" />
            <div className="h-3 w-16 bg-muted/70 rounded-md ml-auto" />
          </div>
        </div>
        <div className="h-2 bg-muted/70 rounded-full" />
        <div className="h-3 w-16 bg-muted/70 rounded-md ml-auto" />
      </div>

      {/* 4 metric cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-muted p-4 space-y-2">
            <div className="h-8 w-8 bg-muted/70 rounded-md" />
            <div className="h-3 w-16 bg-muted/70 rounded-md" />
            <div className="h-7 w-20 bg-muted/70 rounded-md" />
            <div className="h-1.5 bg-muted/70 rounded-full" />
          </div>
        ))}
      </div>

      {/* Phase targets card */}
      <div className="rounded-xl border bg-muted p-4 space-y-3">
        <div className="h-4 w-28 bg-muted/70 rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-muted/70 rounded-md" />
                <div className="h-4 w-24 bg-muted/70 rounded-md" />
              </div>
              <div className="h-1.5 bg-muted/70 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
