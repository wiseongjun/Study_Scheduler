@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> The line above (`@AGENTS.md`) imports `AGENTS.md`, which warns that this project uses **Next.js 16.2.4 + React 19.2.4** with breaking changes from training-data Next. Read `node_modules/next/dist/docs/` for any Next-specific API before writing code.

## Commands

```bash
npm run dev      # next dev (Turbopack default in Next 16)
npm run build    # next build
npm run start    # next start
npm run seed     # tsx supabase/seed/run.ts — wipes & reseeds plan_templates
```

No lint, test, or typecheck scripts are configured. Use `npx tsc --noEmit` for a one-off type check.

`npm run seed` requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. It is **destructive** — `delete().gte("id", 0)` clears the entire `plan_templates` table before reinserting.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict, path alias `@/*` → repo root
- Supabase (`@supabase/ssr`) for auth + Postgres + RLS — Magic Link OTP login only
- Tailwind v4 (`@tailwindcss/postcss`), shadcn (`base-nova` style, `app/globals.css`), lucide-react
- `date-fns` + `date-fns-tz` for all date math
- `@vercel/analytics` mounted in `app/layout.tsx`

## Architecture

### Domain
A 6-month learning tracker (Korean UI). Each user has a `start_date` that determines their **Phase** (`M1`–`M6`, rolling-month). `plan_templates` are global, time-blocked weekday/weekend tasks tagged with `applicable_phases TEXT[]`; rendering "/today" filters templates by the user's current phase + day-of-week and lazily upserts `daily_checks` rows. `metric_events` is append-only (one row per increment, `delta=1`). Weekly retrospectives and monthly checklists are stored as JSONB blobs.

### Routing
- `app/(app)/` — authenticated route group. Its `layout.tsx` calls `supabase.auth.getUser()`, redirects to `/login` if absent, then to `/onboarding` if the user has no `user_profiles` row.
- `app/login/page.tsx` — magic-link form, posts via browser Supabase client.
- `app/auth/callback/route.ts` — exchanges the OTP code for a session, then redirects to `?next=` (defaults to `/today`).
- `proxy.ts` (root) — **this is the Next 16 middleware**, exporting `proxy` (not `middleware`). It refreshes the Supabase session cookie on every request, gates the `(app)` routes, and forwards `x-pathname` for layout use. Do not rename.

### Supabase clients
- `lib/supabase/server.ts` — `createClient()` for RSC/Server Actions/Route Handlers (reads cookies via `next/headers`).
- `lib/supabase/client.ts` — `createBrowserClient()` for `"use client"` components only.
- `proxy.ts` builds its own server client because middleware uses a different cookie API.

### Data layer (`supabase/migrations/0001_init.sql`)
- Tables: `user_profiles`, `plan_templates`, `daily_checks`, `weekly_retrospectives`, `monthly_checklists`, `metric_events`. RLS is on for all of them with `auth.uid() = user_id` policies; `plan_templates` is public-read.
- Views: `v_retro_rate`, `v_daily_completion` (both `security_invoker = true`).
- Function: `current_phase(p_user_id UUID)` — `SECURITY DEFINER` that rejects calls where `p_user_id <> auth.uid()`.
- **`lib/types/database.ts` is hand-maintained**, not generated. When the schema changes, update the SQL migration *and* this file together — the typed Supabase client depends on it.

### Phase calculation lives in two places
- TS: `currentPhase(startDate, override?)` in `lib/utils/date-kst.ts` (used by all RSCs).
- SQL: `current_phase(p_user_id)` in the migration.

Keep these two in sync. Targets per phase are in `lib/types/metrics.ts` (`PHASE_TARGETS`).

### Time zone — always KST
All date keys (`date`, `week_start_date`, `month_start_date`) are KST `yyyy-MM-dd` strings. **Never use `new Date()` directly** for keys — go through `lib/utils/date-kst.ts` (`todayKSTString`, `weekStartKST`, `monthStartKST`, `formatDateKST`, `dayOfWeekKST`, etc.). `weekStartsOn: 1` (Monday).

### Mutations
Server Actions live in each route segment as `actions.ts` (`"use server"`). They re-fetch the user inside the action, mutate via the server Supabase client, then `revalidatePath(...)` the affected routes. Client components like `components/daily/check-item.tsx` wrap them with `useOptimistic` + `useTransition`.

### Idempotency patterns
- `daily_checks`: upserted with `onConflict: "user_id,date,plan_template_id", ignoreDuplicates: true` — safe to call `initDailyChecks` on every render.
- `weekly_retrospectives` / `monthly_checklists`: upserted with their composite unique keys.

### Seed
`supabase/seed/plan-data.ts` exports `PLAN_TEMPLATES` derived from `master-plan-6months.md`. Each row uses `applicable_phases: string[]` so a single template covers multiple phases — when adding tasks, prefer extending the array over duplicating rows.

## Conventions

- All UI strings are Korean. Keep new copy Korean to match (`lib/utils/date-kst.ts` formatters expect Korean labels in callers).
- Auth-protected pages always re-check `getUser()` even though `proxy.ts` already gates them — needed for type narrowing and because the layout pattern can be bypassed by direct RSC rendering.
- Layouts use `headers().get("x-pathname")` (set by `proxy.ts`) to detect the current path during onboarding redirect logic — `usePathname()` is unavailable in server components.
- Use `npm` (not pnpm/yarn). `package-lock.json` is the source of truth.