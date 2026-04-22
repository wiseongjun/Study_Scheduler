export default function OnboardingLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        {/* Title + description */}
        <div className="space-y-2">
          <div className="h-8 w-36 bg-muted rounded-md" />
          <div className="h-4 w-full bg-muted rounded-md" />
          <div className="h-4 w-3/4 bg-muted rounded-md" />
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Date input field */}
          <div className="space-y-1">
            <div className="h-4 w-16 bg-muted rounded-md" />
            <div className="h-9 w-full bg-muted rounded-lg" />
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="h-4 w-full bg-muted/70 rounded-md" />
            <div className="h-4 w-5/6 bg-muted/70 rounded-md" />
            <div className="h-4 w-4/5 bg-muted/70 rounded-md" />
          </div>

          {/* Submit button */}
          <div className="h-9 w-full bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}
