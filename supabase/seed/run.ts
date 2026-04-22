import { createClient } from "@supabase/supabase-js";
import { PLAN_TEMPLATES } from "./plan-data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.\nCopy .env.local.local.example to .env.local.local and fill in values.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log(`Seeding ${PLAN_TEMPLATES.length} plan_templates...`);

  // Clear existing templates
  const { error: deleteError } = await supabase.from("plan_templates").delete().gte("id", 0);
  if (deleteError) {
    console.error("Delete error:", deleteError);
    process.exit(1);
  }

  // Insert in batches of 50
  const BATCH = 50;
  for (let i = 0; i < PLAN_TEMPLATES.length; i += BATCH) {
    const batch = PLAN_TEMPLATES.slice(i, i + BATCH);
    const { error } = await supabase.from("plan_templates").insert(batch);
    if (error) {
      console.error(`Insert error at batch ${i}:`, error);
      process.exit(1);
    }
    console.log(`  Inserted ${Math.min(i + BATCH, PLAN_TEMPLATES.length)}/${PLAN_TEMPLATES.length}`);
  }

  console.log("Seed complete.");
}

main().catch(console.error);
