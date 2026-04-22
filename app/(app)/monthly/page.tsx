import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayKSTString, formatDateKST, currentPhase } from "@/lib/utils/date-kst";
import { saveMonthlyChecklist } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";

const COMMON_CHECKS = [
  { id: "assignment_phase_done", label: "이번 달 목표 Phase를 완료했나요?", category: "과제 진행" },
  { id: "assignment_delay_analyzed", label: "계획보다 늦어진 이유를 파악했나요?", category: "과제 진행" },
  { id: "blog_target_met", label: "블로그 글 목표 편수를 채웠나요?", category: "공개 산출물" },
  { id: "github_commits_ok", label: "GitHub 커밋 그래프가 꾸준한가요?", category: "공개 산출물" },
  { id: "algorithm_target_met", label: "알고리즘 목표 문제 수를 달성했나요?", category: "기초 체력" },
  { id: "db_curriculum_progress", label: "이번 달 DB 커리큘럼을 진행했나요?", category: "기초 체력" },
  { id: "cs_note_rate", label: "CS 파인만 노트를 80% 이상 작성했나요?", category: "기초 체력" },
  { id: "routine_rhythm", label: "기상 시간과 생활 리듬을 유지했나요?", category: "생활 루틴" },
  { id: "exercise_3x", label: "운동을 주 3회 이상 했나요?", category: "생활 루틴" },
  { id: "budget_ok", label: "이번 달 지출이 예산 안에 들었나요?", category: "생활 루틴" },
];

const M3_PLUS_CHECKS = [
  { id: "applications_target", label: "목표한 지원 수를 채웠나요?", category: "지원 활동" },
  { id: "interviews_count", label: "면접을 계획한 만큼 경험했나요?", category: "지원 활동" },
  { id: "interview_debrief_rate", label: "면접 복기 문서를 빠짐없이 작성했나요?", category: "지원 활동" },
];

export default async function MonthlyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("start_date, current_phase_override")
    .eq("user_id", user.id)
    .single();

  if (!profile) { redirect("/onboarding"); return null; }

  const today = todayKSTString();
  const monthStart = today.slice(0, 7) + "-01";

  const phase = currentPhase(profile.start_date, profile.current_phase_override);
  const phaseNum = parseInt(phase.replace("M", ""));
  const showApplicationChecks = phaseNum >= 3;

  const { data: existing } = await supabase
    .from("monthly_checklists")
    .select("*")
    .eq("user_id", user.id)
    .eq("month_start_date", monthStart)
    .maybeSingle();

  const existingChecks = (existing?.checks_json as Record<string, boolean>) ?? {};
  const allChecks = [...COMMON_CHECKS, ...(showApplicationChecks ? M3_PLUS_CHECKS : [])];
  const categories = [...new Set(allChecks.map((c) => c.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">월간 점검</h1>
        <p className="text-sm text-muted-foreground">
          {formatDateKST(monthStart, "yyyy년 M월")} · {phase}
        </p>
      </div>

      <form action={saveMonthlyChecklist} className="space-y-6">
        <input type="hidden" name="phase_id" value={phase} />
        <input type="hidden" name="month_start_date" value={monthStart} />

        {categories.map((cat) => (
          <div key={cat} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">{cat}</h2>
            <div className="space-y-1">
              {allChecks.filter((c) => c.category === cat).map((check) => (
                <label key={check.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 cursor-pointer hover:bg-accent transition-colors">
                  <input
                    type="checkbox"
                    name={`check_${check.id}`}
                    defaultChecked={existingChecks[check.id] ?? false}
                    className="h-4 w-4 rounded border accent-primary"
                  />
                  <span className="text-sm">{check.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">다음 달 조정 사항</h2>
          <textarea
            name="notes"
            defaultValue={existing?.notes ?? ""}
            rows={4}
            placeholder="다음 달에 바꿀 것, 개선할 것..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <SubmitButton>저장하기</SubmitButton>
      </form>
    </div>
  );
}
