import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInBusinessDays, differenceInCalendarDays, format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Accept either a Date, an ISO string, or nullish; return a Date or null. */
export function toDate(d: Date | string | null | undefined): Date | null {
  if (d == null) return null;
  const parsed = d instanceof Date ? d : new Date(d);
  return isValid(parsed) ? parsed : null;
}

export function fmtDate(d: Date | string | null | undefined): string {
  const dt = toDate(d);
  if (!dt) return "—";
  return format(dt, "yyyy-MM-dd");
}

export function daysUntil(d: Date | string | null | undefined): number | null {
  const dt = toDate(d);
  if (!dt) return null;
  return differenceInCalendarDays(dt, new Date());
}

export function businessDaysSince(d: Date | string | null | undefined): number | null {
  const dt = toDate(d);
  if (!dt) return null;
  return differenceInBusinessDays(new Date(), dt);
}

export function ragFor(status: string): "green" | "amber" | "red" | "gray" | "gold" {
  switch (status) {
    case "done":
      return "green";
    case "in_progress":
      return "amber";
    case "at_risk":
      return "amber";
    case "blocked":
      return "red";
    case "deferred":
      return "gold";
    default:
      return "gray";
  }
}

export function ragForGrade(grade: number | null | undefined): "green" | "amber" | "red" | "gray" {
  if (grade === null || grade === undefined) return "gray";
  if (grade >= 0.7) return "green";
  if (grade >= 0.4) return "amber";
  return "red";
}
