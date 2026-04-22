import { toZonedTime, format as formatTz } from "date-fns-tz";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from "date-fns";

const KST = "Asia/Seoul";

export function todayKST(): Date {
  return toZonedTime(new Date(), KST);
}

export function todayKSTString(): string {
  return formatTz(toZonedTime(new Date(), KST), "yyyy-MM-dd", { timeZone: KST });
}

/** 0=일, 1=월, ..., 6=토 */
export function dayOfWeekKST(date?: Date): number {
  const d = toZonedTime(date ?? new Date(), KST);
  return d.getDay();
}

export function weekStartKST(date?: Date): string {
  const d = toZonedTime(date ?? new Date(), KST);
  const monday = startOfWeek(d, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export function monthStartKST(date?: Date): string {
  const d = toZonedTime(date ?? new Date(), KST);
  return format(new Date(d.getFullYear(), d.getMonth(), 1), "yyyy-MM-dd");
}

export function isLastDayOfMonth(date?: Date): boolean {
  const d = toZonedTime(date ?? new Date(), KST);
  const next = new Date(d);
  next.setDate(d.getDate() + 1);
  return next.getMonth() !== d.getMonth();
}

export function isSunday(date?: Date): boolean {
  return dayOfWeekKST(date) === 0;
}

export function formatDateKST(date: Date | string, fmt = "yyyy-MM-dd"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatTz(toZonedTime(d, KST), fmt, { timeZone: KST });
}

export function weekDates(weekStartStr: string): string[] {
  const start = new Date(weekStartStr + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return format(d, "yyyy-MM-dd");
  });
}

export function prevWeekStart(weekStartStr: string): string {
  return format(subWeeks(new Date(weekStartStr + "T00:00:00"), 1), "yyyy-MM-dd");
}

export function nextWeekStart(weekStartStr: string): string {
  return format(addWeeks(new Date(weekStartStr + "T00:00:00"), 1), "yyyy-MM-dd");
}

export function daysElapsed(startDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const today = new Date(todayKSTString() + "T00:00:00");
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysRemaining(startDate: string, totalDays = 180): number {
  return Math.max(0, totalDays - daysElapsed(startDate));
}

export function currentPhase(startDate: string, override?: string | null): string {
  if (override) return override;
  const start = new Date(startDate + "T00:00:00");
  const today = new Date(todayKSTString() + "T00:00:00");
  const years = today.getFullYear() - start.getFullYear();
  const months = today.getMonth() - start.getMonth();
  const monthsElapsed = years * 12 + months + (today.getDate() >= start.getDate() ? 0 : -1);
  return "M" + Math.min(Math.max(monthsElapsed + 1, 1), 6);
}
