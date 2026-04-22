import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? headersList.get("x-pathname") ?? "";
  if (!profile && !pathname.includes("onboarding")) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/today">오늘</NavLink>
            <NavLink href="/week">주간</NavLink>
            <NavLink href="/retrospective">회고</NavLink>
            <NavLink href="/monthly">월간</NavLink>
            <NavLink href="/dashboard">대시보드</NavLink>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {children}
    </Link>
  );
}
