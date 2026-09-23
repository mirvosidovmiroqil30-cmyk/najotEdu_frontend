import type { WeekDay } from "./types";

const WEEK_DAY_JS: Record<WeekDay, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/**
 * Guruh boshlangan sanadan durationMonths davomida weekDays ga mos
 * barcha dars sanalarini qaytaradi.
 */
export function getGroupScheduleDates(
  startDate: string,
  durationMonths: number,
  weekDays: WeekDay[],
): Date[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + durationMonths);

  const allowedDays = new Set(weekDays.map((d) => WEEK_DAY_JS[d]));
  const dates: Date[] = [];

  const cur = new Date(start);
  while (cur <= end) {
    if (allowedDays.has(cur.getDay())) {
      dates.push(new Date(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }

  return dates;
}

/** YYYY-MM-DD formatida sana */
export function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Bugun o'tganmi? */
export function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

/** Bugun */
export function isToday(date: Date): boolean {
  const today = new Date();
  return toDateStr(date) === toDateStr(today);
}
