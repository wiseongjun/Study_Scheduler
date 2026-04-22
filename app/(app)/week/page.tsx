import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayKSTString, weekStartKST, weekDates, prevWeekStart, nextWeekStart, formatDateKST } from "@/lib/utils/date-kst";
import Link from "next/link";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const weekParam = params.week;
  const weekStart = weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)
    ? weekParam
    : weekStartKST();
  const dates = weekDates(weekStart);
  const today = todayKSTString();

  const { data: completions } = await supabase
    .from("v_daily_completion")
    .select("date, done_count, total_count, rate_pct")
    .eq("user_id", user.id)
    .in("date", dates);

  const completionMap = new Map(completions?.map((c) => [c.date, c]) ?? []);

  const weekEnd = dates[6];
  const isCurrentWeek = weekStart === weekStartKST();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">주간 뷰</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/week?week=${prevWeekStart(weekStart)}`} className="px-2 py-1 rounded border hover:bg-accent transition-colors">
            ←
          </Link>
          <span className="text-muted-foreground">
            {formatDateKST(weekStart, "M/d")} ~ {formatDateKST(weekEnd, "M/d")}
          </span>
          <Link
            href={isCurrentWeek ? "/week" : `/week?week=${nextWeekStart(weekStart)}`}
            className={`px-2 py-1 rounded border transition-colors ${isCurrentWeek ? "opacity-40 pointer-events-none" : "hover:bg-accent"}`}
          >
            →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {dates.map((date, i) => {
          const c = completionMap.get(date);
          const isToday = date === today;
          const dow = new Date(date + "T00:00:00").getDay();
          const rate = c ? Math.round(c.rate_pct) : null;

          return (
            <Link
              key={date}
              href={`/today?date=${date}`}
              className={`rounded-xl border p-2 text-center space-y-1 transition-colors hover:bg-accent ${isToday ? "border-primary bg-primary/5" : "bg-card"}`}
            >
              <div className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {DOW[dow]}
              </div>
              <div className={`text-sm font-bold ${isToday ? "text-primary" : ""}`}>
                {new Date(date + "T00:00:00").getDate()}
              </div>
              {c && c.total_count > 0 ? (
                <div className={`text-xs font-medium ${rate === 100 ? "text-green-600 dark:text-green-400" : rate && rate > 50 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
                  {rate}%
                </div>
              ) : (
                <div className="text-xs text-muted-foreground/40">—</div>
              )}
              {c && c.total_count > 0 && (
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, rate ?? 0)}%` }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Weekly summary */}
      {completions && completions.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm font-medium mb-2">이번 주 요약</div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>완료 {completions.reduce((s, c) => s + c.done_count, 0)}개</span>
            <span>전체 {completions.reduce((s, c) => s + c.total_count, 0)}개</span>
            <span>
              평균{" "}
              {Math.round(
                completions.reduce((s, c) => s + c.rate_pct, 0) / completions.length
              )}
              %
            </span>
          </div>
        </div>
      )}

      <Link
        href="/retrospective/new"
        className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        📋 주간 회고 작성하기 →
      </Link>
    </div>
  );
}
