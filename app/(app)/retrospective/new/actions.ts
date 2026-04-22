"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { weekStartKST } from "@/lib/utils/date-kst";
import type { WeeklyRetroData } from "@/lib/types/retrospective";
import type { Json } from "@/lib/types/database";

export async function saveRetrospective(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekStart = (formData.get("week_start_date") as string) ?? weekStartKST();

  const data: WeeklyRetroData = {
    done_this_week: {
      assignment: formData.get("done_assignment") as string ?? "",
      blog: formData.get("done_blog") as string ?? "",
      algorithm: formData.get("done_algorithm") as string ?? "",
      db_cs: formData.get("done_db_cs") as string ?? "",
      application: formData.get("done_application") as string ?? "",
    },
    plan_vs_actual: {
      plan: formData.get("plan") as string ?? "",
      actual: formData.get("actual") as string ?? "",
      gap: formData.get("gap") as string ?? "",
    },
    learned: [
      formData.get("learned_1") as string ?? "",
      formData.get("learned_2") as string ?? "",
      formData.get("learned_3") as string ?? "",
    ],
    blocked: formData.get("blocked") as string ?? "",
    next_goals: [
      formData.get("goal_1") as string ?? "",
      formData.get("goal_2") as string ?? "",
      formData.get("goal_3") as string ?? "",
    ],
    condition: {
      sleep: formData.get("condition_sleep") as string ?? "",
      burnout: formData.get("condition_burnout") as string ?? "",
      sustainable: formData.get("condition_sustainable") as string ?? "",
    },
  };

  await supabase.from("weekly_retrospectives").upsert({
    user_id: user.id,
    week_start_date: weekStart,
    done_this_week: data.done_this_week as unknown as Json,
    plan_vs_actual: data.plan_vs_actual as unknown as Json,
    learned: data.learned,
    blocked: data.blocked,
    next_goals: data.next_goals,
    condition: data.condition as unknown as Json,
  }, { onConflict: "user_id,week_start_date" });

  revalidatePath("/retrospective");
  redirect("/retrospective");
}
