// Seed data derived from master-plan-6months.md (lines 249-281)
// Using applicable_phases[] to avoid duplication across M1-M6

export interface PlanTemplateRow {
  applicable_phases: string[];
  day_of_week: number; // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  time_block_start: string;
  time_block_end: string;
  default_task_label: string;
  routine_type: string;
  sort_order: number;
}

const ALL_PHASES = ["M1", "M2", "M3", "M4", "M5", "M6"];
const EARLY_PHASES = ["M1", "M2"];
const LATE_PHASES = ["M3", "M4", "M5", "M6"];
const WEEKDAYS = [1, 2, 3, 4, 5]; // 월~금

// Helper: expand to per-day rows
function perDay(
  days: number[],
  phases: string[],
  start: string,
  end: string,
  label: string,
  routine: string,
  sort: number
): PlanTemplateRow[] {
  return days.map((d) => ({
    applicable_phases: phases,
    day_of_week: d,
    time_block_start: start,
    time_block_end: end,
    default_task_label: label,
    routine_type: routine,
    sort_order: sort,
  }));
}

// Common weekday blocks (same for all phases, all weekdays)
const commonWeekdayBlocks: PlanTemplateRow[] = [
  ...perDay(WEEKDAYS, ALL_PHASES, "07:00", "08:00", "기상 + 준비 + 가벼운 운동", "morning_routine", 10),
  ...perDay(WEEKDAYS, ALL_PHASES, "08:00", "09:00", "알고리즘 1문제 풀기", "algorithm", 20),
  ...perDay(WEEKDAYS, ALL_PHASES, "12:00", "13:00", "점심 + 휴식 (산책 추천)", "rest", 40),
  ...perDay(WEEKDAYS, ALL_PHASES, "13:00", "16:00", "과제 메인 (오후 집중 3시간)", "main_task", 50),
  ...perDay(WEEKDAYS, ALL_PHASES, "16:00", "16:30", "휴식 + 오늘 진도 기록", "rest", 60),
  ...perDay(WEEKDAYS, ALL_PHASES, "18:00", "19:00", "저녁 + 휴식", "rest", 80),
  ...perDay(WEEKDAYS, ALL_PHASES, "21:00", "22:00", "오늘 회고 + 내일 플랜 (15분)", "review", 100),
  ...perDay(WEEKDAYS, ALL_PHASES, "22:00", "23:00", "취침 준비", "rest", 110),
];

// M1-M2 오전: 단일 과제 블록
const earlyPhaseBlocks: PlanTemplateRow[] = [
  ...perDay(WEEKDAYS, EARLY_PHASES, "09:00", "12:00", "과제 메인 (오전 집중 3시간)", "main_task", 30),
];

// M3-M6 오전: 지원/면접 준비 + 과제 분리
const latePhaseBlocks: PlanTemplateRow[] = [
  ...perDay(WEEKDAYS, LATE_PHASES, "09:00", "10:30", "지원/면접 준비", "interview_prep", 30),
  ...perDay(WEEKDAYS, LATE_PHASES, "10:30", "12:00", "과제 메인", "main_task", 35),
];

// 저녁 16:30-18:00 — 요일별 다름 (all phases)
const eveningStudyBlocks: PlanTemplateRow[] = [
  { applicable_phases: ALL_PHASES, day_of_week: 1, time_block_start: "16:30", time_block_end: "18:00", default_task_label: "블로그 초안 작성", routine_type: "blog", sort_order: 70 },
  { applicable_phases: ALL_PHASES, day_of_week: 2, time_block_start: "16:30", time_block_end: "18:00", default_task_label: "DB 학습 (Real MySQL)", routine_type: "db", sort_order: 70 },
  { applicable_phases: ALL_PHASES, day_of_week: 3, time_block_start: "16:30", time_block_end: "18:00", default_task_label: "CS 학습 (파인만 노트)", routine_type: "cs", sort_order: 70 },
  { applicable_phases: ALL_PHASES, day_of_week: 4, time_block_start: "16:30", time_block_end: "18:00", default_task_label: "DB 학습 (Real MySQL)", routine_type: "db", sort_order: 70 },
  { applicable_phases: ALL_PHASES, day_of_week: 5, time_block_start: "16:30", time_block_end: "18:00", default_task_label: "CS 학습 (파인만 노트)", routine_type: "cs", sort_order: 70 },
];

// 저녁 19:00-21:00 — M1-M2 vs M3+
const eveningWorkBlocks: PlanTemplateRow[] = [
  ...perDay([1], EARLY_PHASES, "19:00", "21:00", "블로그 초안 완성", "blog", 90),
  ...perDay([2, 3, 4, 5], EARLY_PHASES, "19:00", "21:00", "블로그 초안 or 이력서 보강", "misc", 90),
  ...perDay([1], LATE_PHASES, "19:00", "21:00", "블로그 초안 완성", "blog", 90),
  ...perDay([2, 3, 4, 5], LATE_PHASES, "19:00", "21:00", "면접 준비 / 이력서 보강", "interview_prep", 90),
];

// 토 (day=6)
const saturdayBlocks: PlanTemplateRow[] = [
  { applicable_phases: ALL_PHASES, day_of_week: 6, time_block_start: "07:00", time_block_end: "08:00", default_task_label: "기상 + 준비", routine_type: "morning_routine", sort_order: 10 },
  { applicable_phases: ALL_PHASES, day_of_week: 6, time_block_start: "08:00", time_block_end: "10:00", default_task_label: "주간 복습 + 알고리즘 복습 (5문제 재풀이)", routine_type: "algorithm", sort_order: 20 },
  { applicable_phases: ALL_PHASES, day_of_week: 6, time_block_start: "10:00", time_block_end: "13:00", default_task_label: "과제 마무리 / 블로그 완성", routine_type: "main_task", sort_order: 30 },
  { applicable_phases: ALL_PHASES, day_of_week: 6, time_block_start: "13:00", time_block_end: "14:00", default_task_label: "점심", routine_type: "rest", sort_order: 40 },
  { applicable_phases: ALL_PHASES, day_of_week: 6, time_block_start: "14:00", time_block_end: "18:00", default_task_label: "자유 — 과제 or 완전 휴식", routine_type: "rest", sort_order: 50 },
];

// 일 (day=0)
const sundayBlocks: PlanTemplateRow[] = [
  { applicable_phases: ALL_PHASES, day_of_week: 0, time_block_start: "07:00", time_block_end: "08:00", default_task_label: "기상 + 준비", routine_type: "morning_routine", sort_order: 10 },
  { applicable_phases: ALL_PHASES, day_of_week: 0, time_block_start: "08:00", time_block_end: "10:00", default_task_label: "주간 회고 + 다음주 계획 수립", routine_type: "review", sort_order: 20 },
  { applicable_phases: ALL_PHASES, day_of_week: 0, time_block_start: "10:00", time_block_end: "13:00", default_task_label: "가벼운 학습 or AWS Cost Explorer 확인", routine_type: "misc", sort_order: 30 },
  { applicable_phases: ALL_PHASES, day_of_week: 0, time_block_start: "13:00", time_block_end: "20:00", default_task_label: "휴식 / 충전", routine_type: "rest", sort_order: 40 },
  { applicable_phases: ALL_PHASES, day_of_week: 0, time_block_start: "20:00", time_block_end: "22:00", default_task_label: "주간 회고 작성 (앱에서 작성)", routine_type: "review", sort_order: 50 },
];

export const PLAN_TEMPLATES: PlanTemplateRow[] = [
  ...commonWeekdayBlocks,
  ...earlyPhaseBlocks,
  ...latePhaseBlocks,
  ...eveningStudyBlocks,
  ...eveningWorkBlocks,
  ...saturdayBlocks,
  ...sundayBlocks,
];
