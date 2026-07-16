export type StockFacts = {
  name: string;
  isHighProtein: boolean;
};

export type TentComposition = {
  hasToddler: boolean;
  hasPregnantResident: boolean;
};

export type ResidentComposition = {
  age: number;
  isPregnant: boolean;
};

export const TODDLER_MAX_AGE = 3;

export function tentComposition(
  residents: ResidentComposition[],
): TentComposition {
  return {
    hasToddler: residents.some((r) => r.age <= TODDLER_MAX_AGE),
    hasPregnantResident: residents.some((r) => r.isPregnant),
  };
}

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

export function allocatedKcalOf(
  allocations: { quantity: number; kcalPerUnit: number }[],
): number {
  return allocations.reduce((sum, a) => sum + a.quantity * a.kcalPerUnit, 0);
}

export function sufficiencyDecision(
  stock: { name: string; unit: string },
  requestedQuantity: number,
  availableQuantity: number,
): Decision {
  if (!(requestedQuantity > 0)) {
    return { allowed: false, reason: "Quantity to allocate must be greater than zero" };
  }
  if (requestedQuantity > availableQuantity) {
    return {
      allowed: false,
      reason: `Central Inventory holds only ${availableQuantity} ${stock.unit} of ${stock.name}, cannot allocate ${requestedQuantity}`,
    };
  }
  return { allowed: true };
}

export function allocationCheck(input: {
  stock: StockFacts & { unit: string };
  requestedQuantity: number;
  availableQuantity: number;
  tent: TentComposition;
}): Decision {
  const lock = allocationDecision(input.stock, input.tent);
  if (!lock.allowed) return lock;
  return sufficiencyDecision(
    input.stock,
    input.requestedQuantity,
    input.availableQuantity,
  );
}
