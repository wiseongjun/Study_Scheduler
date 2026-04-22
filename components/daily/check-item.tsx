"use client";

import { useOptimistic, useTransition } from "react";
import { toggleCheck } from "@/app/(app)/today/actions";

const ROUTINE_EMOJI: Record<string, string> = {
  morning_routine: "🌅",
  algorithm: "🧮",
  main_task: "💻",
  rest: "☕",
  db: "🗄️",
  cs: "📚",
  blog: "✍️",
  interview_prep: "🎯",
  review: "📝",
  misc: "📋",
};

interface CheckItemProps {
  checkId: string;
  isDone: boolean;
  label: string;
  routineType: string;
  timeRange: string;
}

export function CheckItem({ checkId, isDone, label, routineType, timeRange }: CheckItemProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useOptimistic(isDone);

  const emoji = ROUTINE_EMOJI[routineType] ?? "📌";

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          setOptimisticDone(!optimisticDone);
          await toggleCheck(checkId, !optimisticDone);
        })
      }
      className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed ${
        optimisticDone ? "bg-muted/50 opacity-60" : "bg-card"
      }`}
    >
      <span className="text-lg flex-shrink-0">{optimisticDone ? "✅" : "⬜"}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${optimisticDone ? "line-through text-muted-foreground" : ""}`}>
          {emoji} {label}
        </div>
        <div className="text-xs text-muted-foreground">{timeRange}</div>
      </div>
      {isPending && <span className="text-xs text-muted-foreground animate-pulse">⏳</span>}
    </button>
  );
}
