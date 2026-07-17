import {
  COVER_KUNING_DAYS,
  COVER_MERAH_DAYS,
  type PriorityLevel,
} from "@/lib/rules/heat";

export const SHORTAGE_LOW_DAYS = COVER_KUNING_DAYS;

export type StockLevel = {
  name: string;
  unit: string;
  category: string;
  central: number;
  total: number;
  kcalPerUnit: number;
};

export type ShortageStatus = "HABIS" | "MENIPIS";

export type ShortageItem = {
  name: string;
  unit: string;
  central: number;
  total: number;
  status: ShortageStatus;
  daysOfCover: number | null;
};

export type PoskoCoverage = {
  population: number;
  kcalPerDay: number;
  kcalOnHand: number;
  daysOfCover: number;
  colour: PriorityLevel;
};

const SHORTAGE_RANK: Record<ShortageStatus, number> = { HABIS: 0, MENIPIS: 1 };

const HEALTH_FLAG_LABELS: Record<string, string> = {
  SICK: "Sakit",
  RECOVERING: "Pemulihan",
};

export function residentFlags(resident: {
  isPregnant: boolean;
  healthStatus: string;
  chronicConditions: string[];
}): string[] {
  const flags: string[] = [];
  if (resident.isPregnant) flags.push("Hamil");
  const health = HEALTH_FLAG_LABELS[resident.healthStatus];
  if (health) flags.push(health);
  flags.push(...resident.chronicConditions);
  return flags;
}

export function itemDaysOfCover(
  item: { total: number; kcalPerUnit: number },
  poskoKcalPerDay: number,
): number | null {
  if (item.kcalPerUnit <= 0 || poskoKcalPerDay <= 0) return null;
  return (item.total * item.kcalPerUnit) / poskoKcalPerDay;
}

export function classifyShortages(
  items: StockLevel[],
  poskoKcalPerDay: number,
): ShortageItem[] {
  const shortages: ShortageItem[] = [];

  for (const item of items) {
    const daysOfCover = itemDaysOfCover(item, poskoKcalPerDay);
    const base = {
      name: item.name,
      unit: item.unit,
      central: item.central,
      total: item.total,
      daysOfCover,
    };

    if (item.central <= 0) {
      shortages.push({ ...base, status: "HABIS" });
    } else if (daysOfCover !== null && daysOfCover < SHORTAGE_LOW_DAYS) {
      shortages.push({ ...base, status: "MENIPIS" });
    }
  }

  return shortages.sort(
    (a, b) =>
      SHORTAGE_RANK[a.status] - SHORTAGE_RANK[b.status] ||
      (a.daysOfCover ?? Infinity) - (b.daysOfCover ?? Infinity) ||
      a.name.localeCompare(b.name),
  );
}

export function coverageColour(daysOfCover: number): PriorityLevel {
  if (daysOfCover < COVER_MERAH_DAYS) return "MERAH";
  if (daysOfCover < COVER_KUNING_DAYS) return "KUNING";
  return "HIJAU";
}

export function poskoCoverage(input: {
  population: number;
  kcalPerDay: number;
  kcalOnHand: number;
}): PoskoCoverage {
  const daysOfCover =
    input.kcalPerDay > 0 ? input.kcalOnHand / input.kcalPerDay : Infinity;
  return { ...input, daysOfCover, colour: coverageColour(daysOfCover) };
}
