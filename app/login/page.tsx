"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/today` },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">📅 학습 스케줄러</h1>
          <p className="text-muted-foreground text-sm">
            6개월 재취업 마스터 플랜 실행 도구
          </p>
          <p className="text-xs text-muted-foreground italic">
            오늘 하루가 모여 6개월이 된다.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border bg-card p-6 text-center space-y-3">
            <div className="text-4xl">📧</div>
            <p className="font-medium">이메일을 확인하세요</p>
            <p className="text-sm text-muted-foreground">
              <strong>{email}</strong>로 로그인 링크를 보냈습니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="rounded-xl border bg-card p-6 space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "전송 중..." : "Magic Link 로그인"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
