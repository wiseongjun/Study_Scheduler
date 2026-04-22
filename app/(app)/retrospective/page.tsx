import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDateKST } from "@/lib/utils/date-kst";

export default async function RetrospectivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: retros } = await supabase
    .from("weekly_retrospectives")
    .select("id, week_start_date, created_at, next_goals")
    .eq("user_id", user.id)
    .order("week_start_date", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">주간 회고</h1>
        <Link
          href="/retrospective/new"
          className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + 작성
        </Link>
      </div>

      {(!retros || retros.length === 0) ? (
        <div className="rounded-xl border bg-card p-8 text-center space-y-3">
          <div className="text-4xl">📋</div>
          <p className="text-muted-foreground text-sm">아직 작성한 회고가 없습니다.</p>
          <Link href="/retrospective/new" className="inline-block text-sm text-primary hover:underline">
            첫 번째 주간 회고 작성하기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {retros.map((r, idx) => {
            const weekNum = retros.length - idx;
            const goals = Array.isArray(r.next_goals) ? r.next_goals.filter(Boolean) : [];
            return (
              <div key={r.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">W{weekNum} 회고</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatDateKST(r.week_start_date, "M월 d일")} 주
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateKST(r.created_at, "M/d")}
                  </span>
                </div>
                {goals.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {goals.slice(0, 2).map((g, i) => (
                      <div key={i}>📌 {g}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
