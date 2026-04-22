# Deep Interview Spec: 백수 개발자 면접준비 학습 스케줄러

## Metadata
- Interview ID: dev-sched-2026-04-21
- Rounds: 5
- Final Ambiguity Score: 11.6%
- Type: Greenfield
- Generated: 2026-04-21
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 0.40 | 0.38 |
| Constraint Clarity | 0.88 | 0.30 | 0.264 |
| Success Criteria | 0.80 | 0.30 | 0.24 |
| **Total Clarity** | | | **0.884** |
| **Ambiguity** | | | **0.116** |

## Goal

`master-plan-6months.md`에 정의된 6개월 재취업 마스터 플랜을 매일 실행하기 위한 single-user 웹 앱을 만든다. 정적 markdown 플랜을 구조화된 인터랙티브 체크리스트로 변환해, 사용자가 **매일 5분** 열어서:
1. 오늘(요일 기반) 해야 할 타임 블록을 체크박스로 처리하고,
2. 이번 주 요일별 개요에서 진행 상태를 파악하며,
3. 일요일 저녁에는 주간 회고 폼, 월 말일에는 월간 체크리스트 폼을 작성할 수 있고,
4. 누적 지표(알고리즘 푼 문제 수, 블로그 편수, 회고 작성률 등)를 한눈에 볼 수 있도록 한다.

**우선순위**: "혼자만 쓰는 간단한 도구"가 MVP. 서비스가 쓸만하다 싶으면 다른 사용자도 가입할 수 있도록 **확장 가능한 아키텍처**로 설계하되, 실제 멀티유저 기능(회원가입 페이지, 요금제 등)은 구현하지 않는다.

## Constraints

### 기술
- **Frontend**: Next.js (App Router, TypeScript)
- **Backend/DB/Auth**: Supabase (Postgres + Supabase Auth)
- **배포**: Vercel (프론트), Supabase (데이터 레이어)
- **비용**: 무료 티어 내에서 운영
- **데이터 소스**: `master-plan-6months.md` 파일을 seed로 import해 DB에 저장

### 운영
- **단일 사용자 MVP**: RLS(Row Level Security)로 사용자 격리, 계정 1개만 운영
- **멀티 디바이스 동기화**: Supabase realtime 또는 fetch-on-focus로 다기기 일관성
- **학습 레버리지 아님**: 이 프로젝트 자체를 K8s/AWS 과제로 삼지 않는다 — 빠르게 만들고 도구로 사용

### 아키텍처 제약
- 멀티유저 확장 대비: schema는 처음부터 `user_id` FK 구조로 설계
- 템플릿(마스터플랜)과 사용자 기록을 분리해 저장 (template은 read-only, records는 user-owned)

## Non-Goals (MVP 제외)

- 예산 트래킹 UI (AWS 비용, 책·강의비 등)
- 경고 신호 자동 감지 (3일 연속 미체크 알림 등)
- 지원/면접 로그 풀 폼 (M3+에 필요하지만 MVP 이후 단계)
- 블로그 글 자동 수집/동기화
- K8s/AWS 배포 파이프라인
- 모바일 네이티브 앱 (반응형 웹으로 대체)
- 팀/그룹 기능, 소셜 기능
- 푸시 알림, 이메일 리마인더
- 오프라인 모드 (PWA 수준의 오프라인은 v2에서 검토)

## Acceptance Criteria

### 일일 체크리스트 (Daily View)
- [ ] 로그인 시 오늘 날짜에 해당하는 **요일 기반 타임 블록 체크리스트**가 표시된다 (평일: 07:00~23:00 타임 테이블; 주말: 주말 구조)
- [ ] 각 체크박스 체크/해제는 **즉시** Supabase에 저장되고, 새로고침·다른 기기에서 로그인 후에도 상태가 유지된다
- [ ] 요일별 "저녁" 슬롯은 마스터플랜 요일별 구조와 일치한다 (월: 블로그 초안 / 화: DB / 수: CS / 목: DB / 금: CS / 토: 휴식 / 일: 휴식)
- [ ] **M3부터** 평일 09:00~10:30 슬롯이 "지원/면접 준비"로 자동 교체된다 (현재 Phase 기반 동적 렌더링)

### 주간 뷰 (Weekly View)
- [ ] 이번 주 월~일을 한 화면에서 볼 수 있고, 각 요일의 완료율(체크된 아이템/총 아이템)이 표시된다
- [ ] 오늘 요일이 시각적으로 강조된다
- [ ] 과거 주차를 이전/다음 네비게이션으로 조회 가능하다

### 주간 회고 (Weekly Retrospective)
- [ ] **일요일** 또는 사용자가 "주간 회고 작성" 버튼 클릭 시, 마스터플랜 템플릿 필드를 포함한 회고 폼이 열린다:
  - 이번 주 한 것 (과제/블로그/알고리즘/DB-CS/지원-면접 각각)
  - 계획 대비 달성도 (계획/실제/갭 분석)
  - 배운 것 3줄
  - 막힌 것/해결할 것
  - 다음 주 핵심 목표 3개
  - 컨디션/멘탈 체크 (수면/번아웃 신호/지속 가능성)
- [ ] 작성한 회고는 markdown으로 저장되고 과거 회고 목록에서 조회 가능하다

### 월간 체크리스트 (Monthly Checklist)
- [ ] **월 말일** 또는 사용자가 "월간 점검" 버튼 클릭 시, 월간 점검 체크리스트 폼이 열린다:
  - 과제 진행 (이번 달 Phase 완료 여부, 지연 원인)
  - 공개 산출물 (블로그 편수, GitHub 커밋 그래프)
  - 기초 체력 (알고리즘 수, DB/CS 진도)
  - 루틴 자체 (생활 리듬, 운동, 지출)
  - 지원 활동 (M3+에만 표시)
  - 다음 달 조정 사항 (free text)
- [ ] 현재 월에 맞는 Mn 마일스톤(M1~M6)이 자동으로 pre-fill되어 함께 표시된다

### 누적 지표 대시보드 (Metrics Dashboard)
- [ ] 상단에 현재 Phase (M1~M6)와 D-day (시작일 기준 경과 일수 / 남은 일수) 표시
- [ ] 알고리즘 누적 풀이 수 (사용자가 수동 +1 가능)
- [ ] 블로그 글 누적 편수 (수동 +1 또는 URL 등록)
- [ ] 주간 회고 작성률 (작성한 주 / 경과한 주)
- [ ] 월간 체크리스트 달성률 (체크된 항목 / 총 항목, 누적)
- [ ] 월별 목표 대비 현재치 비교 (예: 블로그 M2 목표 5편 / 현재 3편)

### 온보딩
- [ ] 최초 로그인 시 **시작일 입력** → 이를 기준으로 현재 Mn, 현재 주차 자동 계산
- [ ] `master-plan-6months.md`의 구조(요일별 타임 블록, 월별 마일스톤)가 seed로 DB에 이미 주입되어 있다

### 비기능
- [ ] 반응형 (모바일 Safari/Chrome에서 사용 가능)
- [ ] 초기 로드 2초 이내 (Vercel 무료 티어 기준)
- [ ] 로그인 상태 유지 (Supabase session persistence)

## Assumptions Exposed & Resolved

| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| "매일 들어가서 본다" = 웹일 것이다 | 플랫폼 선택지 4개로 확인 | 웹 앱 확정 |
| 체크박스 내용을 앱이 제공해야 한다 | 템플릿 vs 사용자 입력 vs 혼합 | 사용자가 이미 완성된 플랜 파일을 제공 → 파일 기반 seed + 고정 템플릿 방식 채택 |
| 단순히 나만 쓰면 된다 | 혼자 vs 동기화 vs 멀티유저 | 단일 사용자 + 다기기 동기화 + 멀티유저 확장 가능 구조 |
| 모든 기능을 만들어야 한다 (Contrarian mode) | 예산/경고 감지/블로그 자동집계 등 플랜의 모든 면을 넣을지 | MVP는 "코어 루프(일/주/회고) + 누적 지표"로 한정. 나머지는 non-goal |
| 학습 레버리지로 쓸 것이다 | 이 프로젝트로 K8s/AWS도 배울지 | 인프라 학습은 별도 과제에서. 이 스케줄러는 빠르게 만들어 도구로 사용 |

## Technical Context (Greenfield)

### 선택된 스택
- **Next.js 15+ (App Router)** + TypeScript
- **Supabase**: Postgres DB, Auth (email/password or magic link), RLS
- **UI**: Tailwind CSS + shadcn/ui (빠른 개발)
- **배포**: Vercel (CI/CD 포함)
- **날짜 처리**: `date-fns` 또는 `Temporal` polyfill

### 예비 데이터 모델 (스펙 단계 레퍼런스)
```
users (Supabase Auth)
user_profiles: user_id, start_date, current_phase_override
plan_templates: (seed from markdown) phase_id(M1-M6), day_of_week, time_block_start, time_block_end, default_task_label, routine_type
daily_checks: id, user_id, date, plan_template_id, custom_label, is_done, completed_at
weekly_retrospectives: id, user_id, week_start_date, content_json, created_at
monthly_checklists: id, user_id, month_start_date, phase_id, checks_json, notes, created_at
metrics_counters: id, user_id, metric_type(algorithm/blog/...), count, updated_at
```

### 배포 전략
- Vercel에 push-to-deploy
- Supabase 프로젝트 1개 (무료 티어)
- 환경 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| User | core domain | id, email, start_date | owns all records |
| MasterPlan | core domain | start_date, end_date (start+180d) | per User (1:1) |
| MonthlyPhase | core domain | id(M1~M6), goal, milestone_checks[] | part of MasterPlan |
| DayOfWeek | supporting | name(월~일), is_weekday | referenced by TimeBlock |
| TimeBlock | core domain | day_of_week, start_time, end_time, default_label, routine_type | template entity |
| DailyTask | core domain | date, time_block_ref, is_done, custom_label | User has many; per-date instance of TimeBlock |
| Routine | supporting | type(Algorithm/DB/CS/Blog/Main/Application) | tags DailyTask/TimeBlock |
| WeeklyRetrospective | core domain | week_start_date, content_fields | User has many |
| MonthlyChecklist | core domain | month_start_date, phase_ref, checks_json | User has many |
| Metric | core domain | type, count | User has many |
| ApplicationLog | supporting (post-MVP) | date, company, tier, result | v2 |
| InterviewDebrief | supporting (post-MVP) | date, company, qa_json | v2 |
| BudgetEntry | supporting (post-MVP) | month, category, amount | v2 |
| WarningSignal | supporting (post-MVP) | type, triggered_at | v2 |
| BlogPost | supporting (post-MVP) | url, title, published_at | v2 |

## Ontology Convergence

| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 6 | 6 | - | - | N/A |
| 2 (파일 수신) | 15 | 9 | 3 (Task→DailyTask, Schedule→MasterPlan, MonthlyRetrospective→MonthlyChecklist) | 3 | 40% |
| 3 | 15 | 0 | 0 | 15 | 100% |
| 4 | 15 | 0 | 0 | 15 | 100% |
| 5 | 15 | 0 | 0 | 15 | 100% |

도메인 모델은 Round 3에 수렴해 이후 안정적으로 유지.

## Interview Transcript

<details>
<summary>Full Q&A (5 rounds)</summary>

### Round 1 — Platform
**Q:** 어떤 형태로 쓰고 싶으신가요? (웹/데스크탑/모바일/마크다운)
**A:** 웹 앱 (브라우저)
**Ambiguity:** 60% (Goal 0.55, Constraints 0.30, Criteria 0.30)

### Round 2 — Task Source
**Q:** 매일 체크하는 일정 항목은 어디서 오나요? (내 입력 / 템플릿 / 혼합 / 반복 패턴)
**A:** "내가 일정 파일을 줄게 기달려바" → `master-plan-6months.md` 제공 (6개월 마스터 플랜, 요일별 타임 블록, 월별 마일스톤, 회고 템플릿 포함)
**Ambiguity:** 52% (Goal 0.75, Constraints 0.30, Criteria 0.30)

### Round 3 — Scope & Storage
**Q:** 단일 사용자 로컬 / 다기기 동기화 / 멀티유저 / 미정?
**A:** "일단 나혼자쓰고 여러기기에서 동기화할건데 서비스가 괜찮은거같으면 다른사람도 사용할걸 고려는 해둬야할것같아. 하지만 최우선은 간단하게 나만쓰는걸로"
**Ambiguity:** 41% (Goal 0.80, Constraints 0.60, Criteria 0.30)

### Round 4 — MVP Scope (Contrarian Mode)
**Q:** MVP에 뭘 넣을지 — 코어만 / 코어+대시보드 / 코어+지원로그 / 전부?
**A:** 코어 + 누적 지표 대시보드
**Ambiguity:** 23.5% (Goal 0.90, Constraints 0.60, Criteria 0.75)

### Round 5 — Stack Philosophy
**Q:** 최단경로(Next.js+Supabase) / Spring+React / K8s 도그푸딩 / 알아서?
**A:** 최단 경로: Next.js + Supabase
**Ambiguity:** 11.6% (Goal 0.95, Constraints 0.88, Criteria 0.80) ✅ 임계치 통과

</details>

## Challenge Agents Used
- Round 4: Contrarian Mode (MVP 스코프 축소 유도)