import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayKSTString, daysElapsed, daysRemaining, currentPhase } from "@/lib/utils/date-kst";
import { PHASE_TARGETS } from "@/lib/types/metrics";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("start_date, current_phase_override")
    .eq("user_id", user.id)
    .single();

  if (!profile) { redirect("/onboarding"); return null; }

  const phase = currentPhase(profile.start_date, profile.current_phase_override);

  const today = todayKSTString();
  const monthStart = today.slice(0, 7) + "-01";

  // Algorithm & blog totals
  const { data: algEvents } = await supabase
    .from("metric_events")
    .select("delta")
    .eq("user_id", user.id)
    .eq("metric_type", "algorithm_count");
  const algTotal = algEvents?.reduce((s, e) => s + e.delta, 0) ?? 0;

  const { data: blogEvents } = await supabase
    .from("metric_events")
    .select("delta")
    .eq("user_id", user.id)
    .eq("metric_type", "blog_count");
  const blogTotal = blogEvents?.reduce((s, e) => s + e.delta, 0) ?? 0;

  // Retro rate
  const { data: retroRate } = await supabase
    .from("v_retro_rate")
    .select("written_weeks, elapsed_weeks, rate_pct")
    .eq("user_id", user.id)
    .maybeSingle();

  // Monthly completion rate
  const { data: monthlyCompletion } = await supabase
    .from("v_daily_completion")
    .select("rate_pct")
    .eq("user_id", user.id)
    .gte("date", monthStart)
    .lte("date", today);

  const monthlyAvg = monthlyCompletion && monthlyCompletion.length > 0
    ? Math.round(monthlyCompletion.reduce((s, c) => s + c.rate_pct, 0) / monthlyCompletion.length)
    : 0;

  const elapsed = daysElapsed(profile.start_date);
  const remaining = daysRemaining(profile.start_date);
  const targets = PHASE_TARGETS[phase] ?? PHASE_TARGETS.M1;

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{phase}</div>
            <div className="text-sm text-muted-foreground">6개월 마스터 플랜</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">D+{elapsed}</div>
            <div className="text-xs text-muted-foreground">{remaining}일 남음</div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.round((elapsed / 180) * 100))}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground text-right">
          {Math.min(100, Math.round((elapsed / 180) * 100))}% 진행
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          emoji="🧮"
          label="알고리즘"
          value={algTotal}
          target={targets.algorithm}
          unit="문제"
        />
        <MetricCard
          emoji="✍️"
          label="블로그"
          value={blogTotal}
          target={targets.blog}
          unit="편"
        />
        <MetricCard
          emoji="📋"
          label="주간 회고"
          value={retroRate?.written_weeks ?? 0}
          target={retroRate?.elapsed_weeks ?? 1}
          unit="주"
          suffix={`(${retroRate?.rate_pct ?? 0}%)`}
        />
        <MetricCard
          emoji="✅"
          label="이번 달 달성률"
          value={monthlyAvg}
          unit="%"
          isPercent
        />
      </div>

      {/* Phase targets */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">{phase} 목표 vs 현재</h2>
        <div className="space-y-2">
          <TargetRow label="알고리즘" current={algTotal} target={targets.algorithm} unit="문제" />
          <TargetRow label="블로그" current={blogTotal} target={targets.blog} unit="편" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  emoji, label, value, target, unit, suffix, isPercent,
}: {
  emoji: string; label: string; value: number; target?: number; unit: string; suffix?: string; isPercent?: boolean;
}) {
  const pct = isPercent ? value : target ? Math.min(100, Math.round((value / target) * 100)) : null;
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="text-2xl">{emoji}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">
        {value}{unit}
        {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
      </div>
      {target !== undefined && !isPercent && (
        <div className="text-xs text-muted-foreground">목표 {target}{unit}</div>
      )}
      {pct !== null && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function TargetRow({ label, current, target, unit }: { label: string; current: number; target: number; unit: string }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{current} / {target} {unit}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full transition-all ${pct >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
