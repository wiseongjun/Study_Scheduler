"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALL_CHECK_IDS = [
  "assignment_phase_done", "assignment_delay_analyzed", "blog_target_met",
  "github_commits_ok", "algorithm_target_met", "db_curriculum_progress",
  "cs_note_rate", "routine_rhythm", "exercise_3x", "budget_ok",
  "applications_target", "interviews_count", "interview_debrief_rate",
];

export async function saveMonthlyChecklist(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const phaseId = formData.get("phase_id") as string;
  const monthStart = formData.get("month_start_date") as string;
  if (!phaseId || !monthStart) throw new Error("Missing required fields");
  const notes = (formData.get("notes") as string) ?? "";

  const checks: Record<string, boolean> = {};
  for (const id of ALL_CHECK_IDS) {
    checks[id] = formData.get(`check_${id}`) === "on";
  }

  await supabase.from("monthly_checklists").upsert({
    user_id: user.id,
    month_start_date: monthStart,
    phase_id: phaseId,
    checks_json: checks,
    notes,
  }, { onConflict: "user_id,month_start_date" });

  revalidatePath("/monthly");
  revalidatePath("/today");
  redirect("/dashboard");
}
