"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveStartDate(formData: FormData) {
  const startDate = formData.get("start_date") as string;
  if (!startDate) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("user_profiles").upsert({
    user_id: user.id,
    start_date: startDate,
  });

  if (!error) redirect("/today");
}
