import { saveStartDate } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";

export default function OnboardingPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">시작일 설정</h1>
          <p className="text-muted-foreground text-sm">
            6개월 마스터 플랜의 시작일을 입력하세요. 이 날짜를 기준으로 현재 Phase(M1~M6)와 진도를 계산합니다.
          </p>
        </div>

        <form action={saveStartDate} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="start_date" className="text-sm font-medium">
              시작일
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-1 text-muted-foreground">
            <p>📌 오늘 하루가 모여 6개월이 된다.</p>
            <p>📌 공개되지 않은 것은 시장이 모른다.</p>
            <p>📌 완벽한 준비는 없다. 3개월 차부터 지원한다.</p>
          </div>

          <SubmitButton>시작하기 →</SubmitButton>
        </form>
      </div>
    </div>
  );
}
