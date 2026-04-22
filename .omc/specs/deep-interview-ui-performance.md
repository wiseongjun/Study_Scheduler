# Deep Interview Spec: UI 성능 개선 (Vercel 배포 환경)

## Metadata
- Interview ID: ui-perf-2026-04-22
- Rounds: 4
- Final Ambiguity Score: 12.5%
- Type: Brownfield
- Generated: 2026-04-22
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.90 | 35% | 0.315 |
| Constraint Clarity | 0.85 | 25% | 0.213 |
| Success Criteria | 0.88 | 25% | 0.220 |
| Context Clarity | 0.85 | 15% | 0.128 |
| **Total Clarity** | | | **0.875** |
| **Ambiguity** | | | **0.125** |

## Goal

Vercel 배포 환경에서 발생하는 UX 지연을 해소한다. 핵심은 세 가지:
1. **Optimistic UI** — `/today` 체크박스 토글 및 +1 버튼을 클릭 즉시 UI에 반영하고 백그라운드에서 DB 저장
2. **Loading 피드백** — 모든 폼 제출(회고/월간)에 버튼 비활성화 + 스피너 표시, 모든 라우트에 skeleton 로딩 화면 추가
3. **페이지 초기 로드 개선** — loading.tsx + Suspense로 스트리밍, 전체 데이터 로드 전에 UI 틀 먼저 표시

## Constraints

- **Client Component 전환 허용**: `/today` 인터랙션 컴포넌트를 `"use client"` 로 전환 가능
- **useOptimistic 사용**: React 19 내장 훅 사용 (Next.js 16 지원)
- **useFormStatus 사용**: 폼 제출 pending 상태 감지
- **Server Action 유지**: DB 저장 로직은 Server Action 그대로 유지 (클라이언트 fetch로 바꾸지 않음)
- **비용 무료 티어**: 추가 외부 서비스 도입 없음

## Non-Goals

- 전체 페이지를 SPA로 전환하는 것
- React Query / SWR 같은 클라이언트 캐싱 라이브러리 도입
- 백엔드 쿼리 최적화 (DB 인덱스 추가, 쿼리 병렬화 등) — 이번 스코프 아님
- PWA / 오프라인 모드
- 뷰포트 가상화 (데이터셋이 ~10개로 작아 불필요)

## Acceptance Criteria

### /today 페이지
- [ ] 체크박스 클릭 시 **즉시** ✅/⬜ 전환 (DB 응답 기다리지 않음)
- [ ] 알고리즘/블로그 +1 버튼 클릭 시 카운터 **즉시** +1 반영
- [ ] 여러 번 빠르게 클릭해도 중복 요청 방지 (pending 중 버튼 비활성화)
- [ ] 페이지 초기 로드 시 데이터 로딩 중 skeleton 표시

### /retrospective/new, /monthly 폼
- [ ] 저장하기 버튼 클릭 시 즉시 비활성화 + "저장 중..." 텍스트 또는 스피너
- [ ] 저장 완료 전 중복 제출 불가

### 전체 라우트
- [ ] 각 `app/(app)/*/` 디렉토리에 `loading.tsx` 추가 — 페이지 이동 시 빈 화면 대신 skeleton 표시
- [ ] `app/(app)/layout.tsx` nav 클릭 시 즉시 피드백 (active state)

## Technical Context (Brownfield)

### 현재 상태 (탐색 결과)
- **모든 페이지**: Server Component (Client Component = `logout-button.tsx` 하나뿐)
- **폼 패턴**: `<form action={serverAction}>` — Server Action 직접 연결
- **재검증**: `revalidatePath()` 호출 후 전체 페이지 재렌더링
- **로딩 처리**: 없음 — loading.tsx 파일 0개, Suspense 0개, useFormStatus 0개

### 변경 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/(app)/today/page.tsx` | 데이터 fetch는 유지, 체크리스트 렌더링을 Client Component로 분리 |
| `components/daily/check-item.tsx` (신규) | useOptimistic으로 즉시 토글 |
| `components/daily/metric-counter.tsx` (신규) | useOptimistic으로 즉시 카운터 증가 |
| `app/(app)/today/loading.tsx` (신규) | skeleton |
| `app/(app)/week/loading.tsx` (신규) | skeleton |
| `app/(app)/dashboard/loading.tsx` (신규) | skeleton |
| `app/(app)/retrospective/loading.tsx` (신규) | skeleton |
| `app/(app)/retrospective/new/loading.tsx` (신규) | skeleton |
| `app/(app)/monthly/loading.tsx` (신규) | skeleton |
| `app/(app)/onboarding/loading.tsx` (신규) | skeleton |
| `components/ui/submit-button.tsx` (신규) | useFormStatus 기반 버튼 (pending 시 disabled + 스피너) |
| `app/(app)/retrospective/new/page.tsx` | 저장하기 버튼 → SubmitButton 컴포넌트 교체 |
| `app/(app)/monthly/page.tsx` | 저장하기 버튼 → SubmitButton 컴포넌트 교체 |
| `app/(app)/onboarding/page.tsx` | 시작하기 버튼 → SubmitButton 컴포넌트 교체 |

### 구현 패턴

```tsx
// components/daily/check-item.tsx
'use client'
import { useOptimistic, useTransition } from 'react'
import { toggleCheck } from '@/app/(app)/today/actions'

export function CheckItem({ check, tpl }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticDone, setOptimisticDone] = useOptimistic(check.is_done)

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => {
        setOptimisticDone(!optimisticDone)
        await toggleCheck(check.id, !optimisticDone)
      })}
    >
      {optimisticDone ? '✅' : '⬜'} {label}
    </button>
  )
}
```

```tsx
// components/ui/submit-button.tsx
'use client'
import { useFormStatus } from 'react-dom'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="...">
      {pending ? '저장 중...' : children}
    </button>
  )
}
```

```tsx
// app/(app)/today/loading.tsx (예시)
export default function Loading() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
}
```

## Assumptions Exposed & Resolved

| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| "느리다" = 특정 인터랙션 | 어느 곳이 가장 답답한가? | 전체 다 느림 → 전체 적용 |
| Server Component 유지해야 함 | Client Component 전환 허용 범위 | 인터랙션 컴포넌트만 Client Component로 분리 허용 |
| 폼도 optimistic UI 필요 | 리다이렉트 폼은 optimistic 의미 없음 | 폼은 버튼 비활성화+스피너로 처리, optimistic 불필요 |

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| CheckItem | UI Component | check_id, is_done, label, time_range | today 페이지에 속함 |
| MetricCounter | UI Component | metric_type, count | today 페이지에 속함 |
| SubmitButton | UI Component | pending, label | 폼 페이지에 속함 |
| LoadingSkeleton | UI Component | height, count | 각 loading.tsx에 속함 |
| ServerAction | Backend | toggleCheck, incrementMetric, saveRetro, saveMonthly | CheckItem/SubmitButton이 호출 |

## Ontology Convergence

| Round | Entity Count | New | Stable | Stability Ratio |
|-------|-------------|-----|--------|----------------|
| 1 | 2 | 2 | - | N/A |
| 2 | 4 | 2 | 2 | 50% |
| 3 | 5 | 1 | 4 | 80% |
| 4 | 5 | 0 | 5 | 100% |

## Interview Transcript

<details>
<summary>Full Q&A (4 rounds)</summary>

### Round 1
**Q:** 가장 답답하게 느껴지는 순간이 어느 것인가요?
**A:** 전체 다 느림
**Ambiguity:** 48% (Goal: 0.65, Constraints: 0.40, Criteria: 0.35, Context: 0.70)

### Round 2
**Q:** 체크박스 토글 최적화 방향 — Optimistic UI vs useFormStatus 로딩만?
**A:** Optimistic UI (Client Component) — useOptimistic 사용
**Ambiguity:** 35% (Goal: 0.75, Constraints: 0.70, Criteria: 0.40, Context: 0.75)

### Round 3
**Q:** Optimistic UI + 로딩 처리를 어떤 페이지에 적용할까요?
**A:** 전체 다 해줘
**Ambiguity:** 22% (Goal: 0.85, Constraints: 0.75, Criteria: 0.70, Context: 0.80)

### Round 4
**Q:** 회고/월간 폼 제출 시 개선 방식?
**A:** 제출 버튼 비활성화 + 스피너
**Ambiguity:** 12.5% (Goal: 0.90, Constraints: 0.85, Criteria: 0.88, Context: 0.85)

</details>
