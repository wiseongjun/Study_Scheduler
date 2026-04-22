import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { weekStartKST, formatDateKST } from "@/lib/utils/date-kst";
import { saveRetrospective } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function NewRetrospectivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekStart = weekStartKST();

  const { data: existing } = await supabase
    .from("weekly_retrospectives")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  const e = existing as Record<string, unknown> | null;

  function dtwField(key: string) {
    return (e?.done_this_week as Record<string, string> | null)?.[key] ?? "";
  }
  function pvaField(key: string) {
    return (e?.plan_vs_actual as Record<string, string> | null)?.[key] ?? "";
  }
  function learnedField(i: number) {
    return Array.isArray(e?.learned) ? (e!.learned as string[])[i] ?? "" : "";
  }
  function goalField(i: number) {
    return Array.isArray(e?.next_goals) ? (e!.next_goals as string[])[i] ?? "" : "";
  }
  function condField(key: string) {
    return (e?.condition as Record<string, string> | null)?.[key] ?? "";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">주간 회고</h1>
        <p className="text-sm text-muted-foreground">
          {formatDateKST(weekStart, "M월 d일")} 주 · 일요일 저녁 30분
        </p>
      </div>

      <form action={saveRetrospective} className="space-y-6">
        <input type="hidden" name="week_start_date" value={weekStart} />

        <Section title="✅ 이번 주 한 것">
          <Field label="과제" name="done_assignment" defaultValue={dtwField("assignment")} />
          <Field label="블로그" name="done_blog" defaultValue={dtwField("blog")} />
          <Field label="알고리즘" name="done_algorithm" defaultValue={dtwField("algorithm")} />
          <Field label="DB/CS" name="done_db_cs" defaultValue={dtwField("db_cs")} />
          <Field label="지원/면접" name="done_application" defaultValue={dtwField("application")} />
        </Section>

        <Section title="📊 계획 대비 달성도">
          <Field label="계획" name="plan" defaultValue={pvaField("plan")} />
          <Field label="실제" name="actual" defaultValue={pvaField("actual")} />
          <Field label="갭 분석" name="gap" defaultValue={pvaField("gap")} />
        </Section>

        <Section title="💡 배운 것 (3줄)">
          <Field label="1." name="learned_1" defaultValue={learnedField(0)} />
          <Field label="2." name="learned_2" defaultValue={learnedField(1)} />
          <Field label="3." name="learned_3" defaultValue={learnedField(2)} />
        </Section>

        <Section title="🚧 막힌 것 / 해결할 것">
          <Field label="" name="blocked" defaultValue={e?.blocked as string ?? ""} multiline />
        </Section>

        <Section title="🎯 다음 주 핵심 목표 3개">
          <Field label="1." name="goal_1" defaultValue={goalField(0)} />
          <Field label="2." name="goal_2" defaultValue={goalField(1)} />
          <Field label="3." name="goal_3" defaultValue={goalField(2)} />
        </Section>

        <Section title="💚 컨디션 / 멘탈 체크">
          <Field label="수면" name="condition_sleep" defaultValue={condField("sleep")} />
          <Field label="번아웃 신호" name="condition_burnout" defaultValue={condField("burnout")} />
          <Field label="지속 가능성" name="condition_sustainable" defaultValue={condField("sustainable")} />
        </Section>

        <SubmitButton>저장하기</SubmitButton>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, name, defaultValue = "", multiline = false }: {
  label: string; name: string; defaultValue?: string; multiline?: boolean;
}) {
  const cls = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="flex gap-2 items-start">
      {label && <label className="text-xs text-muted-foreground w-16 pt-2 flex-shrink-0">{label}</label>}
      {multiline ? (
        <textarea name={name} defaultValue={defaultValue} rows={3} className={cls} />
      ) : (
        <input type="text" name={name} defaultValue={defaultValue} className={cls} />
      )}
    </div>
  );
}
