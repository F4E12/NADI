import type { Entitlement } from "@/lib/rules/entitlement";
import type { PriorityLevel } from "@/lib/rules/heat";

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  MERAH: "Merah",
  KUNING: "Kuning",
  HIJAU: "Hijau",
};

const PRIORITY_TONES: Record<PriorityLevel, "red" | "amber" | "green"> = {
  MERAH: "red",
  KUNING: "amber",
  HIJAU: "green",
};

export function priorityLabel(p: PriorityLevel): string {
  return PRIORITY_LABELS[p];
}

export function priorityTone(p: PriorityLevel): "red" | "amber" | "green" {
  return PRIORITY_TONES[p];
}

export const TONE_BADGE: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

const kcal = new Intl.NumberFormat("id-ID");

export function formatKcal(value: number): string {
  return `${kcal.format(Math.round(value))} kkal`;
}

export function formatWater(litres: number): string {
  return `${kcal.format(Math.round(litres))} L`;
}

export function entitlementLine(e: Entitlement): string {
  return `${formatKcal(e.kcalPerDay)} · ${formatWater(e.cleanWaterLitresPerDay)} per hari`;
}

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value: Date | string): string {
  return dateTime.format(new Date(value));
}

export function formatDaysOfCover(days: number): string {
  if (!Number.isFinite(days)) return "∞";
  return `${days.toFixed(1)} hari`;
}

export function coverTone(days: number): "red" | "amber" | "green" {
  if (days < 1) return "red";
  if (days < 2) return "amber";
  return "green";
}
