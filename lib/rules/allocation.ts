export type StockFacts = {
  name: string;
  isHighProtein: boolean;
};

export type StockAllocationFacts = StockFacts & {
  inventoryId: string;
  category: string;
  unit: string;
  available: number;
  kcalPerUnit: number;
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

export type AutoAllocationPlanItem = {
  inventoryId: string;
  name: string;
  unit: string;
  quantity: number;
};

const WATER_UNITS_PER_PERSON = 2;
const WATER_BUFFER_RATIO = 0.1;

export function suggestTentAllocationPlan(input: {
  requirementKcalPerDay: number;
  allocatedKcal: number;
  tentPopulation: number;
  stock: StockAllocationFacts[];
  tent: TentComposition;
}): AutoAllocationPlanItem[] {
  const remainingKcal = Math.max(0, input.requirementKcalPerDay - input.allocatedKcal);
  const eligible = input.stock
    .filter((item) => item.available > 0 && (item.kcalPerUnit > 0 || isWaterItem(item)))
    .filter((item) =>
      allocationDecision({ name: item.name, isHighProtein: item.isHighProtein }, input.tent).allowed,
    );

  if (eligible.length === 0) return [];


    const waterBudget = eligible.some(isWaterItem)
  ? Math.ceil(input.tentPopulation * WATER_UNITS_PER_PERSON * (1 + WATER_BUFFER_RATIO))
  : 0;
  console.log("Water budget:", waterBudget, "units for", input.tentPopulation, "people");
  const riceBudget = eligible.some(isRiceItem) ? Math.ceil(input.tentPopulation * 0.25) : 0;
  const oilBudget = eligible.some(isOilItem) ? Math.ceil(input.tentPopulation * 0.03) : 0;
  const otherBudget = remainingKcal * 0.45;

  const plan: AutoAllocationPlanItem[] = [
    ...allocateUnitBucket(eligible.filter(isWaterItem), waterBudget),
    ...allocateUnitBucket(eligible.filter(isRiceItem), riceBudget),
    ...allocateUnitBucket(eligible.filter(isOilItem), oilBudget),
    ...allocateBucket(
      eligible.filter((item) => !isRiceItem(item) && !isOilItem(item) && !isWaterItem(item)),
      otherBudget,
    ),
  ];

  return plan.filter((item) => item.quantity > 0);
}

function isRiceItem(item: StockAllocationFacts): boolean {
  return item.name === "Beras" || item.category === "Beras";
}

function isOilItem(item: StockAllocationFacts): boolean {
  return item.name.includes("Minyak") || item.category === "Minyak goreng";
}

function allocateUnitBucket(
  items: StockAllocationFacts[],
  targetQuantity: number,
): AutoAllocationPlanItem[] {
  if (items.length === 0 || targetQuantity <= 0) return [];

  const quantities = new Map<string, number>();
  let remainingUnits = targetQuantity;

  while (remainingUnits > 0) {
    let progressed = false;

    for (const item of items) {
      const current = quantities.get(item.inventoryId) ?? 0;
      if (current >= item.available) continue;

      quantities.set(item.inventoryId, current + 1);
      remainingUnits -= 1;
      progressed = true;

      if (remainingUnits <= 0) break;
    }

    if (!progressed) break;
  }

  return items
    .map((item) => ({
      inventoryId: item.inventoryId,
      name: item.name,
      unit: item.unit,
      quantity: quantities.get(item.inventoryId) ?? 0,
    }))
    .filter((item) => item.quantity > 0);
}

function allocateBucket(
  items: StockAllocationFacts[],
  budgetKcal: number,
): AutoAllocationPlanItem[] {
  if (items.length === 0 || budgetKcal <= 0) return [];

  const quantities = new Map<string, number>();
  let remainingKcal = budgetKcal;

  while (remainingKcal > 0) {
    let progressed = false;

    for (const item of items) {
      const current = quantities.get(item.inventoryId) ?? 0;
      if (current >= item.available) continue;
      if (remainingKcal < item.kcalPerUnit) continue;

      quantities.set(item.inventoryId, current + 1);
      remainingKcal -= item.kcalPerUnit;
      progressed = true;

      if (remainingKcal <= 0) break;
    }

    if (!progressed) break;
  }

  return items
    .map((item) => ({
      inventoryId: item.inventoryId,
      name: item.name,
      unit: item.unit,
      quantity: quantities.get(item.inventoryId) ?? 0,
    }))
    .filter((item) => item.quantity > 0);
}

export type DistributionFacts = {
  stockName: string;
  unit: string;
  requestedQuantity: number;
  tentAllocationQuantity: number;
  householdKcalPerDay: number;
  householdMemberCount: number;
  alreadyCollectedThisPeriod: boolean;
  isWaterStock: boolean;
};

export function distributionDecision(f: DistributionFacts): Decision {
  if (f.householdKcalPerDay <= 0) {
    return {
      allowed: false,
      reason: "This household has no entitlement to draw a ration",
    };
  }
  if (f.isWaterStock) {
    const minimumWater = f.householdMemberCount * 2;
    if (f.requestedQuantity < minimumWater) {
      return {
        allowed: false,
        reason: `This household needs at least ${minimumWater} ${f.unit} of water for ${f.householdMemberCount} members`,
      };
    }
  }
  if (f.alreadyCollectedThisPeriod) {
    return {
      allowed: false,
      reason: `This household already collected ${f.stockName} in this period`,
    };
  }
  if (!(f.requestedQuantity > 0)) {
    return { allowed: false, reason: "Quantity to distribute must be greater than zero" };
  }
  if (f.requestedQuantity > f.tentAllocationQuantity) {
    return {
      allowed: false,
      reason: `This tent's allocation holds only ${f.tentAllocationQuantity} ${f.unit} of ${f.stockName}, cannot distribute ${f.requestedQuantity}`,
    };
  }
  return { allowed: true };
}

export type DistributionStockFacts = {
  inventoryId: string;
  name: string;
  unit: string;
  available: number;
  kcalPerUnit: number;
  collectedThisPeriod: boolean;
};

export function suggestDistributionSelection(input: {
  householdKcalPerDay: number;
  householdMemberCount: number;
  stock: DistributionStockFacts[];
}): { inventoryId: string; quantity: number } | null {
  if (input.householdKcalPerDay <= 0) return null;

  const water = input.stock.find((candidate) => candidate.name === "Air bersih");
  if (water && water.available > 0 && !water.collectedThisPeriod) {
    return {
      inventoryId: water.inventoryId,
      quantity: Math.max(input.householdMemberCount * 2, 1),
    };
  }

  const item = input.stock.find(
    (candidate) =>
      candidate.available > 0 &&
      candidate.kcalPerUnit > 0 &&
      !candidate.collectedThisPeriod,
  );
  if (!item) return null;

  return {
    inventoryId: item.inventoryId,
    quantity: Math.max(1, Math.floor(input.householdKcalPerDay / item.kcalPerUnit)),
  };
}

export type DistributionPlanItem = {
  inventoryId: string;
  name: string;
  unit: string;
  available: number;
  suggestedQuantity: number;
  collectedThisPeriod: boolean;
};

export function suggestDistributionPlan(input: {
  householdKcalPerDay: number;
  householdMemberCount: number;
  stock: DistributionStockFacts[];
}): DistributionPlanItem[] {
  let remainingKcal = Math.max(0, input.householdKcalPerDay);
  const plan: DistributionPlanItem[] = [];

  const water = input.stock.find((candidate) => candidate.name === "Air bersih");
  if (water && water.available > 0 && !water.collectedThisPeriod) {
    plan.push({
      inventoryId: water.inventoryId,
      name: water.name,
      unit: water.unit,
      available: water.available,
      suggestedQuantity: Math.max(input.householdMemberCount * 2, 1),
      collectedThisPeriod: water.collectedThisPeriod,
    });
  }

  const ordered = [...input.stock].sort((a, b) => {
    if (a.kcalPerUnit !== b.kcalPerUnit) return b.kcalPerUnit - a.kcalPerUnit;
    return a.name.localeCompare(b.name);
  });

  for (const item of ordered) {
    if (item.available <= 0) continue;
    if (item.collectedThisPeriod) continue;
    if (item.name === "Air bersih") continue;

    if (item.kcalPerUnit <= 0) {
      plan.push({
        inventoryId: item.inventoryId,
        name: item.name,
        unit: item.unit,
        available: item.available,
        suggestedQuantity: 0,
        collectedThisPeriod: item.collectedThisPeriod,
      });
      continue;
    }

    const suggestedQuantity = Math.min(
      item.available,
      Math.floor(remainingKcal / item.kcalPerUnit),
    );
    if (suggestedQuantity <= 0) continue;

    plan.push({
      inventoryId: item.inventoryId,
      name: item.name,
      unit: item.unit,
      available: item.available,
      suggestedQuantity,
      collectedThisPeriod: item.collectedThisPeriod,
    });
    remainingKcal -= suggestedQuantity * item.kcalPerUnit;
  }

  return plan;
}


function isWaterItem(item: StockAllocationFacts): boolean {
  return item.name === "Air bersih" || item.category === "Air bersih";
}