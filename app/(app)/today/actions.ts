"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayKSTString } from "@/lib/utils/date-kst";

export async function initDailyChecks(date: string, templateIds: number[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const inserts = templateIds.map((id) => ({
    user_id: user.id,
    date,
    plan_template_id: id,
    is_done: false,
  }));

  await supabase.from("daily_checks").upsert(inserts, {
    onConflict: "user_id,date,plan_template_id",
    ignoreDuplicates: true,
  });
}

export async function toggleCheck(checkId: string, isDone: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("daily_checks")
    .update({
      is_done: isDone,
      completed_at: isDone ? new Date().toISOString() : null,
    })
    .eq("id", checkId)
    .eq("user_id", user.id);

  revalidatePath("/today");
}

export async function incrementMetric(metricType: "algorithm_count" | "blog_count") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("metric_events").insert({
    user_id: user.id,
    metric_type: metricType,
    date: todayKSTString(),
    delta: 1,
  });

  revalidatePath("/today");
  revalidatePath("/dashboard");
}
