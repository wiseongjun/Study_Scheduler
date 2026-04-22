# 개발자 학습 스케줄러

> 6개월 재취업 마스터 플랜 실행 도구

매일의 시간 블록을 체크하고, 주간 회고와 월간 점검으로 진도를 추적하는 1인용 학습 트래커입니다. 시작일을 기준으로 자동 계산되는 Phase(M1~M6)에 따라 매일의 할 일과 목표가 달라집니다.

## 주요 기능

- **오늘** — 오늘 요일·Phase에 맞는 시간 블록 체크리스트, 알고리즘/블로그 카운터
- **주간** — 7일 달성률 그리드, 주간 요약
- **회고** — 주간 회고 작성·열람 (일요일 배너 알림)
- **월간** — 카테고리별 점검 체크리스트 + 다음 달 메모 (월 말일 배너 알림)
- **대시보드** — Phase 목표 대비 누적 알고리즘·블로그·회고율·이번 달 달성률

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- Supabase (Auth Magic Link · Postgres · RLS)
- Tailwind CSS v4 · shadcn (`base-nova`) · lucide-react
- date-fns / date-fns-tz (KST 고정)
- Vercel Analytics

## 시작하기

### 1. 환경 변수

`.env.local.example`을 복사하여 `.env.local`을 만들고 Supabase 값을 채웁니다.

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # seed 스크립트 전용
```

### 2. 데이터베이스

Supabase SQL Editor 등에서 마이그레이션을 적용합니다.

```
supabase/migrations/0001_init.sql
```

### 3. 시드 데이터

`plan_templates`에 6개월 마스터 플랜 시간 블록을 채웁니다. **기존 데이터는 모두 삭제 후 재삽입됩니다.**

```bash
npm run seed
```

### 4. 개발 서버

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속 → 이메일로 Magic Link 로그인 → 시작일 입력 → `/today`로 진입.

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run seed` | `plan_templates` 시드 (서비스 롤 키 필요) |

## 프로젝트 구조

```
app/
  (app)/                인증 필요 라우트 그룹
    today/              오늘 할 일 체크
    week/               주간 달성률
    retrospective/      주간 회고 (목록 / new)
    monthly/            월간 점검
    dashboard/          누적 지표
    onboarding/         시작일 설정
  auth/callback/        Supabase OTP 콜백
  login/                Magic Link 로그인
components/             UI 컴포넌트 (daily, ui, ...)
lib/
  supabase/             서버/클라이언트용 Supabase 팩토리
  types/                Database, metrics, retrospective 타입
  utils/date-kst.ts     KST 고정 날짜 유틸
proxy.ts                Next.js 16 미들웨어 (세션 갱신·라우트 가드)
supabase/
  migrations/0001_init.sql
  seed/                 plan_templates 시드 데이터
master-plan-6months.md  Phase별 목표·시간 블록 원본
```

## 핵심 개념

- **Phase (M1~M6)** — `user_profiles.start_date`를 기준으로 매월 자동 진행. `current_phase_override`로 수동 고정 가능.
- **plan_templates** — 시간 블록 마스터. `applicable_phases TEXT[]`로 여러 Phase에 동시 적용.
- **daily_checks** — 오늘 페이지 진입 시 해당 요일·Phase 템플릿으로 lazy 생성 (idempotent upsert).
- **metric_events** — append-only. 카운터 증가는 새 row 삽입(`delta=1`).
- **KST 고정** — 모든 날짜 키는 `lib/utils/date-kst.ts`를 거쳐 생성.

## 배포

Vercel에 연결된 상태입니다. `main` 브랜치 푸시 시 자동 배포됩니다. 환경 변수는 Vercel 대시보드의 Environment Variables에 동일하게 등록해야 합니다.