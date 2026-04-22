# Developer Scheduler — Consensus Implementation Plan

> Status: APPROVED (Planner → Architect → Critic, 1 iteration)
> Generated: 2026-04-21
> Spec: `.omc/specs/deep-interview-developer-scheduler.md`

---

## RALPLAN-DR Summary

### Principles
1. **MVP-first**: 6개 핵심 기능만 구현. 확장은 v2로 명시적 분리
2. **Single source of truth**: `master-plan-6months.md`가 원본, seed는 TypeScript 상수로 수작업 정제
3. **멀티유저 대비 스키마**: 단일 사용자 MVP이나 `user_id` FK + RLS 처음부터 적용
4. **파생 지표는 계산**: 회고 작성률/달성률은 SQL View로 도출, 수동 카운터는 event table로 기록
5. **KST 기준**: 날짜/요일 계산은 `Asia/Seoul` 타임존 고정 (Application 레이어에서 처리)

### Decision Drivers (Top 3)
1. **Phase별 타임블록 차이 처리** — M1-M2와 M3-M6 오전 블록이 다름
2. **일별 체크 데이터의 FK 무결성** — daily_checks가 어떤 템플릿을 참조하는지 DB 레벨 보장
3. **지표 날짜 차원** — 월별 목표 대비 현재치 비교를 위해 이벤트 이력 필요

### Viable Options: plan_templates 모델링

**Option A — Fully Normalized Rows (채택)**
- Phase × 요일 × 블록 조합마다 독립 row
- Pros: FK 직접 참조, 단순 쿼리, 멀티유저 확장 시 FK 무결성 가치 급증
- Cons: ~420 rows seed (Architect 권고: `applicable_phases` 배열로 ~80 rows로 감소 가능)

**Option B — JSONB 템플릿 문서**
- Phase별 JSON 1-2개 문서
- Pros: Seed 최소, 변경 간편
- Cons: daily_checks FK 불가, View 집계 어려움

**결정: Option A (with applicable_phases 배열로 개선)**
- 멀티유저 확장 시 FK 무결성 가치 급증 (Principle #3)
- `applicable_phases TEXT[]`로 row 수 420 → 80 수준으로 감소

---

## ADR

| 항목 | 내용 |
|---|---|
| **Decision** | plan_templates를 정규화 row + applicable_phases 배열로 모델링 |
| **Drivers** | FK 무결성, daily_checks 쿼리 단순성, 멀티유저 확장 대비 |
| **Alternatives** | JSONB 템플릿 문서 — FK 불가, View 집계 어려움으로 기각 |
| **Why Chosen** | applicable_phases 배열로 seed 중복 제거 + FK 유지 (Architect synthesis path) |
| **Consequences** | `WHERE phase = ANY(applicable_phases)` 쿼리 필요, 단순 FK보다 약간 복잡 |
| **Follow-ups** | Phase 구조 대폭 변경 시 JSONB 마이그레이션 경로 검토 |

---

## Changelog (Architect + Critic 반영)

- `current_phase()` → **rolling month** 방식으로 변경 (`start_date + interval '(n-1) months'`)
- `metrics_counters` → **`metric_events` append-only 테이블**로 교체 (날짜 차원 확보)
- Step 5 → **Step 5a (월간 + 대시보드 + 온보딩)**와 **Step 5b (배포)**로 분리
- 대시보드 Acceptance Criteria → 기댓값 수치 포함으로 구체화
- plan_templates → `applicable_phases TEXT[]` 도입 (seed row 80% 감소)
- KST 변환 → DB 함수 제거, Application 레이어(`date-fns-tz`)로 이동

---

## Implementation Steps

### Step 1: 프로젝트 스캐폴딩 + Supabase Auth
**예상 소요: 2-3h**

#### 작업 내용
- `pnpm create next-app@latest developer-scheduler --typescript --tailwind --app`
- shadcn/ui 초기화: `pnpm dlx shadcn@latest init`
- Supabase 클라이언트 구성
- Supabase Auth 미들웨어 (magic link)
- 인증 보호 레이아웃 분리

#### 주요 파일
```
package.json
next.config.ts
tailwind.config.ts
middleware.ts                        ← Supabase session 갱신 + 미인증 리다이렉트
app/layout.tsx
app/(app)/layout.tsx                 ← 인증 필요 영역
app/login/page.tsx
lib/supabase/server.ts               ← createServerClient (SSR)
lib/supabase/client.ts               ← createBrowserClient (CSR)
.env.local.example
components/ui/                       ← shadcn 컴포넌트
```

#### Acceptance Criteria
- [ ] `pnpm dev` → `localhost:3000` 로그인 페이지 렌더링
- [ ] magic link 인증 완료 후 `/(app)` 접근 가능
- [ ] 미인증 상태에서 `/(app)/*` → `/login` 리다이렉트
- [ ] `app/(app)/layout.tsx`에서 `user.id` 콘솔 확인

---

### Step 2: DB 스키마 + RLS + Seed 데이터
**예상 소요: 3-4h**

#### 마이그레이션 (`supabase/migrations/0001_init.sql`)

```sql
-- user_profiles
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  start_date DATE NOT NULL,
  current_phase_override TEXT,  -- null이면 자동 계산
  created_at TIMESTAMPTZ DEFAULT now()
);

-- plan_templates (Option A + applicable_phases)
CREATE TABLE plan_templates (
  id SERIAL PRIMARY KEY,
  applicable_phases TEXT[] NOT NULL,  -- e.g. '{M1,M2}' or '{M3,M4,M5,M6}'
  day_of_week SMALLINT NOT NULL,      -- 0=일 ~ 6=토
  time_block_start TIME NOT NULL,
  time_block_end TIME NOT NULL,
  default_task_label TEXT NOT NULL,
  routine_type TEXT NOT NULL,
  sort_order SMALLINT DEFAULT 0
);

-- daily_checks
CREATE TABLE daily_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  plan_template_id INT REFERENCES plan_templates NOT NULL,
  custom_label TEXT,
  is_done BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, date, plan_template_id)
);

-- weekly_retrospectives
CREATE TABLE weekly_retrospectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  week_start_date DATE NOT NULL,
  -- 6개 구조화 섹션을 컬럼으로 펼침 (JSONB 대신 컬럼: View 집계에 유리)
  done_this_week JSONB NOT NULL,      -- {assignment,blog,algorithm,db_cs,application}
  plan_vs_actual JSONB NOT NULL,      -- {plan,actual,gap}
  learned TEXT[] NOT NULL DEFAULT '{}',   -- 3줄
  blocked TEXT,
  next_goals TEXT[] NOT NULL DEFAULT '{}', -- 3개
  condition JSONB NOT NULL,           -- {sleep,burnout,sustainable}
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- monthly_checklists
CREATE TABLE monthly_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  month_start_date DATE NOT NULL,
  phase_id TEXT NOT NULL,
  checks_json JSONB NOT NULL,  -- Phase별 체크항목이 다르므로 JSONB 유지
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month_start_date)
);

-- metric_events (append-only, 날짜 차원 보유)
CREATE TABLE metric_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  metric_type TEXT NOT NULL,  -- 'algorithm_count','blog_count'
  date DATE NOT NULL,
  delta INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### DB 함수

```sql
-- Rolling month 방식 Phase 계산 (Architect 필수 수정 #1)
CREATE OR REPLACE FUNCTION current_phase(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_start_date DATE;
  v_months_elapsed INT;
  v_override TEXT;
BEGIN
  SELECT start_date, current_phase_override
  INTO v_start_date, v_override
  FROM user_profiles WHERE user_id = p_user_id;

  IF v_override IS NOT NULL THEN RETURN v_override; END IF;
  IF v_start_date IS NULL THEN RETURN NULL; END IF;

  -- rolling month: start_date + n months
  v_months_elapsed := EXTRACT(YEAR FROM age(CURRENT_DATE, v_start_date)) * 12
                    + EXTRACT(MONTH FROM age(CURRENT_DATE, v_start_date));

  RETURN 'M' || LEAST(v_months_elapsed + 1, 6)::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### SQL Views

```sql
-- 주간 회고 작성률
CREATE VIEW v_retro_rate AS
SELECT
  user_id,
  COUNT(*) AS written_weeks,
  GREATEST(1, EXTRACT(WEEK FROM CURRENT_DATE) - EXTRACT(WEEK FROM
    (SELECT start_date FROM user_profiles up WHERE up.user_id = wr.user_id)
  )) AS elapsed_weeks,
  ROUND(COUNT(*) * 100.0 / GREATEST(1,
    EXTRACT(WEEK FROM CURRENT_DATE) - EXTRACT(WEEK FROM
      (SELECT start_date FROM user_profiles up WHERE up.user_id = wr.user_id)
    )
  ), 1) AS rate_pct
FROM weekly_retrospectives wr
GROUP BY user_id;

-- 일별 달성률
CREATE VIEW v_daily_completion AS
SELECT
  user_id,
  date,
  COUNT(*) FILTER (WHERE is_done) AS done_count,
  COUNT(*) AS total_count,
  ROUND(COUNT(*) FILTER (WHERE is_done) * 100.0 / NULLIF(COUNT(*), 0), 1) AS rate_pct
FROM daily_checks
GROUP BY user_id, date;
```

#### RLS 정책
```sql
-- 모든 테이블: auth.uid() = user_id
-- plan_templates: public read (RLS 비활성 또는 SELECT TO authenticated)
```

#### Seed 데이터 (`supabase/seed/plan-data.ts`)
- `master-plan-6months.md` 라인 249-281 기반 TypeScript 상수 배열
- applicable_phases로 중복 최소화: `['M1','M2']` vs `['M3','M4','M5','M6']`
- 평일 블록: 07:00-08:00(기상/운동), 08:00-09:00(알고리즘), 09:00-12:00(과제), 12:00-13:00(점심), 13:00-16:00(과제), 16:00-16:30(휴식/기록), 16:30-18:00(DB/CS/요일별), 18:00-19:00(저녁/휴식), 19:00-21:00(블로그/이력서/면접준비), 21:00-22:00(회고/플랜), 22:00-23:00(취침)
- M3+ 오전 오버라이드: 09:00-10:30 → 지원/면접 준비, 10:30-12:00 → 과제
- 토/일: 주말 전용 블록 (`supabase/seed/plan-data.ts`에 별도 배열)

#### 주요 파일
```
supabase/migrations/0001_init.sql
supabase/seed/plan-data.ts
supabase/seed/run.ts                 ← admin client로 plan_templates INSERT
lib/types/database.ts                ← supabase gen types 출력
lib/types/retrospective.ts          ← weekly_retrospectives JSONB 필드 TypeScript 타입
lib/types/metrics.ts                 ← metric_events 타입
```

#### Acceptance Criteria
- [ ] `supabase db reset` 성공, 7개 테이블 + 2개 View 생성 확인
- [ ] `plan_templates`에 `applicable_phases = '{M1,M2}'` 및 `'{M3,M4,M5,M6}'` row 존재
- [ ] `SELECT current_phase(user_id)` → start_date 기준 rolling month로 올바른 Mn 반환 (edge case: 오늘 = start_date → 'M1', start_date + 31일 → 'M2')
- [ ] RLS 테스트: user_A 세션에서 user_B의 daily_checks 조회 → 0 rows
- [ ] Seed 실행 후 plan_templates row 수 ≤ 100개 (applicable_phases 덕분에 중복 없음)

---

### Step 3: 일일 체크리스트 (Today View)
**예상 소요: 3-4h**

#### 작업 내용
- 오늘 날짜 KST 기준 요일 + current_phase로 해당 plan_templates 조회
  - `WHERE day_of_week = $day AND $phase = ANY(applicable_phases)`
- daily_checks 없으면 Server Action으로 자동 생성 (템플릿 기반)
- 체크박스 토글 → optimistic UI + `is_done` 업데이트
- 타임블록별 카드 (시간 범위, 라벨, 루틴 타입 뱃지)
- 상단: 오늘 날짜 · 요일 · Phase(Mn) · D-day 표시
- 알고리즘/블로그 +1 버튼 → `metric_events` INSERT

#### 주요 파일
```
app/(app)/today/page.tsx
app/(app)/today/actions.ts           ← toggleCheck, incrementMetric, initDailyChecks
components/daily/time-block-card.tsx
components/daily/metric-counter.tsx
lib/utils/date-kst.ts               ← date-fns-tz로 KST 변환 유틸
```

#### Acceptance Criteria
- [ ] M1 수요일 접속 시 블록 순서: 07:00 기상/운동 → 08:00 알고리즘 → 09:00 과제(3h) → 12:00 점심 → 13:00 과제(3h) → 16:00 휴식/기록 → 16:30 CS학습 → 18:00 저녁 → 19:00 블로그/이력서 → 21:00 회고/플랜
- [ ] M3 수요일 접속 시: 09:00 블록이 "지원/면접 준비(09-10:30)"로 표시, 과제는 10:30부터
- [ ] 체크박스 토글 → 페이지 새로고침 후 상태 유지 (DB 저장 확인)
- [ ] 다른 기기 로그인 후 동일 체크 상태 표시 (Supabase 동기화)
- [ ] 알고리즘 +1 클릭 → `metric_events`에 row INSERT 확인
- [ ] 토요일 접속 시 주말 전용 블록 표시 (복습/블로그/휴식)

---

### Step 4: 주간 뷰 + 주간 회고 폼
**예상 소요: 3-4h**

#### 작업 내용

**주간 뷰 (`/week`)**:
- 이번 주 월~일 7칸 그리드
- 각 칸: 날짜, 요일, 완료율(%) 배지 (v_daily_completion View)
- 오늘 날짜 하이라이트
- 각 날짜 클릭 → `/today?date=YYYY-MM-DD` (과거 날짜 조회)
- 이전/다음 주 네비게이션

**주간 회고 폼 (`/retrospective/new`)**:
- `weekly_retrospectives` 스키마의 6개 컬럼 필드화
  - done_this_week: 과제/블로그/알고리즘/DB-CS/지원면접 각각 textarea
  - plan_vs_actual: 계획·실제·갭 textarea 3개
  - learned: 3개 텍스트 필드
  - blocked: textarea
  - next_goals: 3개 텍스트 필드
  - condition: 수면/번아웃/지속가능성 select + textarea
- 일요일 Today 뷰 상단에 "주간 회고 작성하기" 배너 (이미 작성 시 비표시)
- 회고 목록 (`/retrospective`): 작성일·주차 표시, 클릭해서 내용 조회

#### 주요 파일
```
app/(app)/week/page.tsx
app/(app)/retrospective/page.tsx
app/(app)/retrospective/new/page.tsx
app/(app)/retrospective/new/actions.ts
components/week/day-cell.tsx
components/week/week-nav.tsx
components/retrospective/retro-form.tsx
components/retrospective/retro-banner.tsx
```

#### Acceptance Criteria
- [ ] 주간 뷰: 7칸 표시, 각 칸에 완료율(%) 숫자 렌더링
- [ ] 완료율 계산: `done_count / total_count` from `v_daily_completion`
- [ ] 오늘 날짜 칸이 시각적으로 구분됨 (다른 배경색/테두리)
- [ ] 이전/다음 주 네비게이션 동작
- [ ] 회고 폼 제출 → `weekly_retrospectives` row INSERT 확인
- [ ] 이미 작성된 주에 `/retrospective/new` 접근 시 "이미 작성됨" 안내 및 수정 링크
- [ ] 일요일 Today 뷰 상단 배너 표시 (작성 시 비표시)

---

### Step 5a: 월간 체크리스트 + 대시보드 + 온보딩
**예상 소요: 3-4h**

#### 작업 내용

**온보딩 (`/onboarding`)**:
- 최초 로그인 → `user_profiles` 없으면 `/onboarding` 리다이렉트
- start_date 날짜 입력 → `user_profiles` INSERT → `/today`

**월간 체크리스트 (`/monthly`)**:
- 현재 Phase 기반 해당 월 체크항목 표시
- 카테고리: 과제 진행 / 공개 산출물 / 기초 체력 / 루틴 자체 / 지원 활동(M3+만 표시)
- 말일 Today 뷰 상단 "월간 점검하기" 배너 (작성 시 비표시)
- `monthly_checklists` checks_json으로 저장

**누적 지표 대시보드 (`/dashboard`)**:
- Phase 인디케이터: 현재 Mn, 경과 일수, 남은 일수 (start_date 기준 D+n / 180-n)
- 알고리즘 누적: `SUM(delta) FROM metric_events WHERE metric_type='algorithm_count'`
- 블로그 누적: `SUM(delta) FROM metric_events WHERE metric_type='blog_count'`
- 주간 회고 작성률(%): `v_retro_rate`
- 이번 달 달성률(%): `AVG(rate_pct) FROM v_daily_completion WHERE date >= month_start`
- 월별 목표 대비 현재치: 현재 Phase Mn의 목표값과 현재 count 비교 카드
  - 예: M2 블로그 목표 5편 / 현재 3편 → "3/5 (60%)"

#### 주요 파일
```
app/(app)/onboarding/page.tsx
app/(app)/onboarding/actions.ts
app/(app)/monthly/page.tsx
app/(app)/monthly/actions.ts
app/(app)/dashboard/page.tsx
components/dashboard/metric-card.tsx   ← 숫자 + 목표 대비 표시
components/dashboard/phase-indicator.tsx
components/monthly/monthly-form.tsx
components/monthly/monthly-banner.tsx
```

#### Acceptance Criteria
- [ ] 최초 로그인 사용자 → `/onboarding` 리다이렉트, start_date 입력 후 `/today` 진입
- [ ] `user_profiles` 있는 사용자 → `/today` 바로 이동
- [ ] 월간 체크리스트 폼 제출 → `monthly_checklists` row INSERT 확인
- [ ] M3 미만 phase → "지원 활동" 카테고리 미표시 / M3+ → 표시
- [ ] 대시보드 알고리즘 카운터: metric_events에 5개 INSERT 후 대시보드에서 "5"로 표시
- [ ] 대시보드 블로그 카운터: metric_events에 2개 INSERT 후 대시보드에서 "2"로 표시
- [ ] 대시보드 회고 작성률: 2주 경과, 1회 작성 시 "50%" 표시
- [ ] 이번 달 달성률: 오늘 daily_checks 7개 중 5개 완료 시 "71%" 표시 (수동 검증)
- [ ] 월별 목표 비교 카드: M1 알고리즘 목표 20문제, 현재 metric_events sum 기준 표시
- [ ] 말일 Today 뷰 상단 월간 배너 표시 (작성 시 비표시)

---

### Step 5b: Vercel 배포
**예상 소요: 1-2h**

#### 작업 내용
- `vercel` CLI 또는 Vercel 대시보드에서 프로젝트 연결
- 환경변수 설정: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase → Authentication → URL Configuration에 Vercel URL 추가
- 프로덕션 빌드 확인 (`pnpm build`)

#### Acceptance Criteria
- [ ] `pnpm build` 오류 없이 성공
- [ ] Vercel 프로덕션 URL에서 로그인 가능
- [ ] 프로덕션에서 온보딩 → Today → 주간 뷰 → 회고 → 월간 → 대시보드 E2E 플로우 동작
- [ ] 모바일 Safari/Chrome에서 Today 뷰 기본 반응형 동작 확인

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Phase 전환 시점 오류 | 잘못된 블록 표시 | rolling month `current_phase()` + edge case 단위 테스트 (오늘=시작일, 말일 시작) |
| applicable_phases 쿼리 오류 | 블록 미표시 | `WHERE $phase = ANY(applicable_phases)` 통합 테스트 |
| Supabase RLS 미적용 | 데이터 노출 | Step 2 AC에서 cross-user 접근 테스트 필수 |
| weekly_retrospectives 중복 제출 | 데이터 불일치 | UNIQUE(user_id, week_start_date) 제약 + 폼에서 기존 row 확인 |
| metric_events 날짜 집계 오류 | 잘못된 지표 | 대시보드 AC에서 INSERT 후 직접 수치 검증 |

---

## Verification Plan

| 단계 | 검증 방법 |
|---|---|
| Step 1 완료 | `pnpm dev` → 로그인 → 인증 보호 페이지 접근 확인 |
| Step 2 완료 | `supabase db reset` → SQL 쿼리로 테이블/View/함수/RLS 검증 |
| Step 3 완료 | 요일/phase 조합별 브라우저 체크리스트 + 토글 후 새로고침 |
| Step 4 완료 | 주간 뷰 완료율 수동 계산 비교 + 회고 폼 저장/조회 |
| Step 5a 완료 | 대시보드 각 지표 DB 직접 INSERT 후 화면 수치 비교 |
| Step 5b 완료 | Vercel 프로덕션 URL E2E + 모바일 반응형 확인 |

---

## Estimated Timeline

| Step | Hours |
|---|---|
| Step 1: Scaffold + Auth | 2-3h |
| Step 2: Schema + Seed | 3-4h |
| Step 3: Daily Checklist | 3-4h |
| Step 4: Weekly View + Retro | 3-4h |
| Step 5a: Monthly + Dashboard + Onboarding | 3-4h |
| Step 5b: Deploy | 1-2h |
| **Total** | **15-21h** |
