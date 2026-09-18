import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInBusinessDays, differenceInCalendarDays, format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtDate(d: Date | null | undefined): string {
  if (!d || !isValid(d)) return "—";
  return format(d, "yyyy-MM-dd");
}

export function daysUntil(d: Date | null | undefined): number | null {
  if (!d || !isValid(d)) return null;
  return differenceInCalendarDays(d, new Date());
}

export function businessDaysSince(d: Date | null | undefined): number | null {
  if (!d || !isValid(d)) return null;
  return differenceInBusinessDays(new Date(), d);
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
