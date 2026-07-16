export type StockFacts = {
  name: string;
  isHighProtein: boolean;
};

export type TentComposition = {
  hasToddler: boolean;
  hasPregnantResident: boolean;
};

export type Decision = { allowed: true } | { allowed: false; reason: string };

export function allocationDecision(
  stock: StockFacts,
  tent: TentComposition,
): Decision {
  if (!stock.isHighProtein) return { allowed: true };
  if (tent.hasToddler || tent.hasPregnantResident) return { allowed: true };

  return {
    allowed: false,
    reason: `${stock.name} is high-protein stock, and this tent has no toddler and no pregnant resident`,
  };
}

export function daysOfCover(allocatedKcal: number, tentKcalPerDay: number): number {
  if (tentKcalPerDay === 0) return Infinity;
  return allocatedKcal / tentKcalPerDay;
}
