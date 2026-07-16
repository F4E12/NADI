import type { Entitlement } from "@/lib/rules/entitlement";

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

export function formatDaysOfCover(days: number): string {
  if (!Number.isFinite(days)) return "∞";
  return `${days.toFixed(1)} hari`;
}

export function coverTone(days: number): "red" | "amber" | "green" {
  if (days < 1) return "red";
  if (days < 2) return "amber";
  return "green";
}
