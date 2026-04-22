"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }
  return (
    <button
      onClick={handleLogout}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      로그아웃
    </button>
  );
}
