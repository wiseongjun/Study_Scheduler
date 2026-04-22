import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayKSTString, dayOfWeekKST, weekStartKST, isLastDayOfMonth, isSunday, formatDateKST, currentPhase } from "@/lib/utils/date-kst";
import { initDailyChecks } from "./actions";
import { CheckItem } from "@/components/daily/check-item";
import { MetricCounter } from "@/components/daily/metric-counter";
import Link from "next/link";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("start_date, current_phase_override")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const today = todayKSTString();
  const dow = dayOfWeekKST();

  const phase = currentPhase(profile.start_date, profile.current_phase_override);

  // Get matching templates for today
  const { data: templates } = await supabase
    .from("plan_templates")
    .select("*")
    .eq("day_of_week", dow)
    .contains("applicable_phases", [phase])
    .order("sort_order");

  if (templates && templates.length > 0) {
    const templateIds = templates.map((t) => t.id);
    await initDailyChecks(today, templateIds);
  }

  // Get today's checks
  const { data: checks } = await supabase
    .from("daily_checks")
    .select("*, plan_templates(default_task_label, routine_type, time_block_start, time_block_end, sort_order)")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("plan_templates(sort_order)");

  const doneCount = checks?.filter((c) => c.is_done).length ?? 0;
  const totalCount = checks?.length ?? 0;

  // Get today's metric counts
  const { data: algEvents } = await supabase
    .from("metric_events")
    .select("delta")
    .eq("user_id", user.id)
    .eq("metric_type", "algorithm_count")
    .eq("date", today);
  const todayAlg = algEvents?.reduce((s, e) => s + e.delta, 0) ?? 0;

  // Banners
  const showRetroBanner = isSunday();
  const showMonthlyBanner = isLastDayOfMonth();

  // Check if retro already written this week
  const weekStart = weekStartKST();
  const { data: existingRetro } = await supabase
    .from("weekly_retrospectives")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  // Check if monthly already written
  const monthStart = today.slice(0, 7) + "-01";
  const { data: existingMonthly } = await supabase
    .from("monthly_checklists")
    .select("id")
    .eq("user_id", user.id)
    .eq("month_start_date", monthStart)
    .maybeSingle();

  const DOW_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {formatDateKST(today, "M월 d일")} ({DOW_LABEL[dow]}요일)
          </h1>
          <p className="text-sm text-muted-foreground">{phase} · {doneCount}/{totalCount} 완료</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>오늘 알고리즘: {todayAlg}문제</div>
        </div>
      </div>

      {/* Banners */}
      {showRetroBanner && !existingRetro && (
        <Link href="/retrospective/new" className="block rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors">
          📋 일요일 저녁입니다. <strong>주간 회고</strong>를 작성해보세요 →
        </Link>
      )}
      {showMonthlyBanner && !existingMonthly && (
        <Link href="/monthly" className="block rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors">
          📆 월 말일입니다. <strong>월간 점검</strong>을 진행해보세요 →
        </Link>
      )}

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.round((doneCount / totalCount) * 100)}%` }}
          />
        </div>
      )}

      {/* Check list */}
      <div className="space-y-2">
        {checks?.map((check) => {
          const tpl = check.plan_templates as { default_task_label: string; routine_type: string; time_block_start: string; time_block_end: string } | null;
          if (!tpl) return null;
          const label = check.custom_label ?? tpl.default_task_label;
          const timeRange = `${tpl.time_block_start.slice(0, 5)}~${tpl.time_block_end.slice(0, 5)}`;

          return (
            <CheckItem
              key={check.id}
              checkId={check.id}
              isDone={check.is_done}
              label={label}
              routineType={tpl.routine_type}
              timeRange={timeRange}
            />
          );
        })}
      </div>

      {/* Metric counters */}
      <div className="flex gap-2 pt-2">
        <MetricCounter
          metricType="algorithm_count"
          initialCount={todayAlg}
          emoji="🧮"
          label="알고리즘"
        />
        <MetricCounter
          metricType="blog_count"
          initialCount={0}
          emoji="✍️"
          label="블로그"
        />
      </div>
    </div>
  );
}
