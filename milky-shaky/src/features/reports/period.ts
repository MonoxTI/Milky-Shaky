import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const REPORT_TIME_ZONE = "Africa/Johannesburg";
export const MAX_SPAN_DAYS = 366;

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DateRange {
  from: string; // YYYY-MM-DD, inclusive, store time
  to: string; // YYYY-MM-DD, inclusive, store time
  start: Date; // start of `from` as a UTC instant
  endExclusive: Date; // start of the day after `to` as a UTC instant
}

/** Midnight at the start of a store-local date, as a UTC instant. */
export function startOfDay(date: string): Date {
  return fromZonedTime(`${date}T00:00:00`, REPORT_TIME_ZONE);
}

export function shiftDay(date: string, days: number): string {
  const shifted = new Date(startOfDay(date).getTime() + days * DAY_MS);
  return formatInTimeZone(shifted, REPORT_TIME_ZONE, "yyyy-MM-dd");
}

function isRealDate(value: string | undefined): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false;
  const instant = startOfDay(value);
  if (Number.isNaN(instant.getTime())) return false;
  // Round-trip check rejects impossible dates such as 2026-02-30.
  return formatInTimeZone(instant, REPORT_TIME_ZONE, "yyyy-MM-dd") === value;
}

function daysBetween(from: string, to: string): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/** Turns URL parameters into a safe date range. Defaults to the last 7 days. */
export function resolveRange(fromParam?: string, toParam?: string, now: Date = new Date()): DateRange {
  const today = formatInTimeZone(now, REPORT_TIME_ZONE, "yyyy-MM-dd");

  let to = isRealDate(toParam) ? toParam : today;
  let from = isRealDate(fromParam) ? fromParam : shiftDay(to, -6);

  if (from > to) [from, to] = [to, from];
  if (daysBetween(from, to) >= MAX_SPAN_DAYS) from = shiftDay(to, -(MAX_SPAN_DAYS - 1));

  return {
    from,
    to,
    start: startOfDay(from),
    endExclusive: new Date(startOfDay(to).getTime() + DAY_MS),
  };
}

export function presetRanges(now: Date = new Date()) {
  const today = formatInTimeZone(now, REPORT_TIME_ZONE, "yyyy-MM-dd");
  return [
    { label: "Today", from: today, to: today },
    { label: "Last 7 days", from: shiftDay(today, -6), to: today },
    { label: "Last 30 days", from: shiftDay(today, -29), to: today },
    { label: "Last 90 days", from: shiftDay(today, -89), to: today },
  ];
}