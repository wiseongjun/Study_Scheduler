export default function RetrospectiveLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 bg-muted rounded-md" />
        <div className="h-8 w-16 bg-muted rounded-lg" />
      </div>

      {/* List rows */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-muted p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-muted/70 rounded-md" />
                <div className="h-4 w-20 bg-muted/70 rounded-md" />
              </div>
              <div className="h-4 w-10 bg-muted/70 rounded-md" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-48 bg-muted/70 rounded-md" />
              <div className="h-3 w-40 bg-muted/70 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
