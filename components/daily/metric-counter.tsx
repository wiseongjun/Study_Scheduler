"use client";

import { useOptimistic, useTransition } from "react";
import { incrementMetric } from "@/app/(app)/today/actions";

interface MetricCounterProps {
  metricType: "algorithm_count" | "blog_count";
  initialCount: number;
  emoji: string;
  label: string;
}

export function MetricCounter({ metricType, initialCount, emoji, label }: MetricCounterProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCount, addOptimistic] = useOptimistic(
    initialCount,
    (current: number, delta: number) => current + delta
  );

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          addOptimistic(1);
          await incrementMetric(metricType);
        })
      }
      className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1"
    >
      {emoji} {label} +1
      {optimisticCount > 0 && (
        <span className="ml-1 text-xs text-muted-foreground">({optimisticCount})</span>
      )}
    </button>
  );
}
