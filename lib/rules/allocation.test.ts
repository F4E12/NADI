import { describe, expect, it } from "vitest";
import {
  allocatedKcalOf,
  allocationCheck,
  allocationDecision,
  daysOfCover,
  distributionDecision,
  sufficiencyDecision,
  suggestDistributionSelection,
  suggestTentAllocationPlan,
  tentComposition,
} from "./allocation";

describe("allocationDecision", () => {
  const protein = { name: "Susu bubuk", isHighProtein: true };
  const staple = { name: "Beras", isHighProtein: false };

  it("permits non-high-protein stock regardless of composition", () => {
    expect(
      allocationDecision(staple, { hasToddler: false, hasPregnantResident: false }),
    ).toEqual({ allowed: true });
  });

  it("refuses high-protein stock for a tent with no toddler and no pregnant resident", () => {
    const decision = allocationDecision(protein, {
      hasToddler: false,
      hasPregnantResident: false,
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toContain("Susu bubuk");
      expect(decision.reason).toContain("high-protein");
      expect(decision.reason).toContain("no toddler");
      expect(decision.reason).toContain("no pregnant resident");
    }
  });

  it("permits the same high-protein stock for a tent with a toddler", () => {
    expect(
      allocationDecision(protein, { hasToddler: true, hasPregnantResident: false }),
    ).toEqual({ allowed: true });
  });

  it("permits the same high-protein stock for a tent with a pregnant resident", () => {
    expect(
      allocationDecision(protein, { hasToddler: false, hasPregnantResident: true }),
    ).toEqual({ allowed: true });
  });
});

describe("tentComposition rollup", () => {
  it("rolls composition up from residents, not from a stored flag", () => {
    expect(
      tentComposition([
        { age: 30, isPregnant: false },
        { age: 28, isPregnant: false },
      ]),
    ).toEqual({ hasToddler: false, hasPregnantResident: false });
  });

  it("counts a resident at the toddler age boundary as a toddler", () => {
    expect(tentComposition([{ age: 3, isPregnant: false }]).hasToddler).toBe(true);
    expect(tentComposition([{ age: 4, isPregnant: false }]).hasToddler).toBe(false);
  });

  it("detects a pregnant resident anywhere in the tent", () => {
    expect(
      tentComposition([
        { age: 30, isPregnant: false },
        { age: 27, isPregnant: true },
      ]).hasPregnantResident,
    ).toBe(true);
  });

  it("feeds the lock: a plain-adult tent rolls up to a refusal", () => {
    const composition = tentComposition([
      { age: 40, isPregnant: false },
      { age: 38, isPregnant: false },
    ]);
    const decision = allocationDecision(
      { name: "Telur", isHighProtein: true },
      composition,
    );

    expect(decision.allowed).toBe(false);
  });
});

describe("daysOfCover", () => {
  it("divides the allocation by the daily requirement", () => {
    expect(daysOfCover(6000, 2000)).toBe(3);
  });

  it("reports unbounded cover when nothing is required", () => {
    expect(daysOfCover(500, 0)).toBe(Infinity);
  });
});

describe("allocatedKcalOf", () => {
  it("sums quantity times kcal-per-unit across a tent's allocations", () => {
    expect(
      allocatedKcalOf([
        { quantity: 2, kcalPerUnit: 3600 },
        { quantity: 10, kcalPerUnit: 70 },
      ]),
    ).toBe(7900);
  });

  it("is zero for a dry tent", () => {
    expect(allocatedKcalOf([])).toBe(0);
  });
});

describe("sufficiencyDecision", () => {
  const beras = { name: "Beras", unit: "kg" };

  it("permits an allocation the pool can cover", () => {
    expect(sufficiencyDecision(beras, 40, 100)).toEqual({ allowed: true });
  });

  it("refuses more than the pool holds, naming what is left", () => {
    const decision = sufficiencyDecision(beras, 150, 100);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toContain("Beras");
      expect(decision.reason).toContain("100 kg");
      expect(decision.reason).toContain("150");
    }
  });

  it("refuses a non-positive quantity", () => {
    expect(sufficiencyDecision(beras, 0, 100).allowed).toBe(false);
  });
});

describe("allocationCheck", () => {
  const protein = { name: "Susu bubuk", unit: "kg", isHighProtein: true };
  const staple = { name: "Beras", unit: "kg", isHighProtein: false };
  const plainTent = { hasToddler: false, hasPregnantResident: false };
  const qualifyingTent = { hasToddler: true, hasPregnantResident: false };

  it("fails composition before it ever looks at the pool", () => {
    const decision = allocationCheck({
      stock: protein,
      requestedQuantity: 5,
      availableQuantity: 1000,
      tent: plainTent,
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toContain("no toddler and no pregnant resident");
    }
  });

  it("fails on the pool once composition passes", () => {
    const decision = allocationCheck({
      stock: protein,
      requestedQuantity: 5,
      availableQuantity: 2,
      tent: qualifyingTent,
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toContain("Central Inventory holds only");
    }
  });

  it("permits a staple the pool can cover regardless of composition", () => {
    expect(
      allocationCheck({
        stock: staple,
        requestedQuantity: 20,
        availableQuantity: 50,
        tent: plainTent,
      }),
    ).toEqual({ allowed: true });
  });
});

describe("distributionDecision", () => {
  const base = {
    stockName: "Beras",
    unit: "kg",
    requestedQuantity: 5,
    tentAllocationQuantity: 100,
    householdKcalPerDay: 6600,
    householdMemberCount: 4,
    alreadyCollectedThisPeriod: false,
    isWaterStock: false,
  };

  it("permits a handover the tent can cover to an entitled household", () => {
    expect(distributionDecision(base)).toEqual({ allowed: true });
  });

  it("refuses a second collection in the same period, naming the objection", () => {
    const decision = distributionDecision({ ...base, alreadyCollectedThisPeriod: true });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toContain("already collected");
      expect(decision.reason).toContain("Beras");
    }
  });

  it("refuses when the tent allocation is insufficient, naming what is left", () => {
    const decision = distributionDecision({
      ...base,
      requestedQuantity: 150,
      tentAllocationQuantity: 100,
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toContain("holds only 100 kg");
      expect(decision.reason).toContain("cannot distribute 150");
    }
  });

  it("refuses a household with no entitlement", () => {
    const decision = distributionDecision({ ...base, householdKcalPerDay: 0 });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toContain("no entitlement");
  });

  it("checks duplicate before sufficiency — the more actionable refusal wins", () => {
    const decision = distributionDecision({
      ...base,
      alreadyCollectedThisPeriod: true,
      requestedQuantity: 999,
      tentAllocationQuantity: 1,
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toContain("already collected");
  });

  it("requires at least 2 liters of water per household member", () => {
    const decision = distributionDecision({
      ...base,
      stockName: "Air bersih",
      unit: "liter",
      isWaterStock: true,
      requestedQuantity: 7,
      householdMemberCount: 4,
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toContain("at least 8");
      expect(decision.reason).toContain("water");
    }
  });
});

describe("suggestTentAllocationPlan", () => {
  it("prefers allocatable stock and skips locked high-protein items", () => {
    const plan = suggestTentAllocationPlan({
      requirementKcalPerDay: 5000,
      allocatedKcal: 0,
      tentPopulation: 36,
      tent: { hasToddler: false, hasPregnantResident: false },
      stock: [
        {
          inventoryId: "protein",
          name: "Susu bubuk",
          category: "Gizi tinggi protein",
          unit: "kg",
          available: 10,
          kcalPerUnit: 4900,
          isHighProtein: true,
        },
        {
          inventoryId: "staple",
          name: "Beras",
          category: "Makanan pokok",
          unit: "kg",
          available: 10,
          kcalPerUnit: 3600,
          isHighProtein: false,
        },
      ],
    });

    expect(plan.some((item) => item.inventoryId === "protein")).toBe(false);
    expect(plan.find((item) => item.inventoryId === "staple")?.quantity ?? 0).toBeGreaterThan(0);
  });

  it("spreads the plan across multiple items instead of dumping everything into the first one", () => {
    const plan = suggestTentAllocationPlan({
      requirementKcalPerDay: 5000,
      allocatedKcal: 0,
      tentPopulation: 36,
      tent: { hasToddler: true, hasPregnantResident: false },
      stock: [
        {
          inventoryId: "ikan",
          name: "Ikan kaleng",
          category: "Gizi tinggi protein",
          unit: "kaleng",
          available: 1000,
          kcalPerUnit: 190,
          isHighProtein: true,
        },
        {
          inventoryId: "beras",
          name: "Beras",
          category: "Makanan pokok",
          unit: "kg",
          available: 1000,
          kcalPerUnit: 3600,
          isHighProtein: false,
        },
        {
          inventoryId: "mie",
          name: "Mie instan",
          category: "Makanan pokok",
          unit: "bungkus",
          available: 1000,
          kcalPerUnit: 380,
          isHighProtein: false,
        },
      ],
    });

    expect(plan.length).toBeGreaterThan(1);
    expect(plan.find((item) => item.inventoryId === "beras")?.quantity ?? 0).toBeGreaterThan(0);
    expect(plan.find((item) => item.inventoryId === "ikan")?.quantity ?? 0).toBeGreaterThan(0);
    expect(plan.some((item) => item.inventoryId === "beras")).toBe(true);
    expect(plan.some((item) => item.inventoryId === "mie")).toBe(true);
  });
});

describe("suggestDistributionSelection", () => {
  it("prefills a non-empty quantity from household entitlement and skips already collected items", () => {
    expect(
      suggestDistributionSelection({
        householdKcalPerDay: 2200,
        householdMemberCount: 4,
        stock: [
          {
            inventoryId: "beras",
            name: "Beras",
            unit: "kg",
            available: 100,
            kcalPerUnit: 3600,
            collectedThisPeriod: false,
          },
          {
            inventoryId: "telur",
            name: "Telur",
            unit: "butir",
            available: 24,
            kcalPerUnit: 70,
            collectedThisPeriod: true,
          },
        ],
      }),
    ).toEqual({ inventoryId: "beras", quantity: 1 });
  });

  it("prefers water when available and uses the household minimum", () => {
    expect(
      suggestDistributionSelection({
        householdKcalPerDay: 2200,
        householdMemberCount: 5,
        stock: [
          {
            inventoryId: "air",
            name: "Air bersih",
            unit: "liter",
            available: 100,
            kcalPerUnit: 0,
            collectedThisPeriod: false,
          },
          {
            inventoryId: "beras",
            name: "Beras",
            unit: "kg",
            available: 100,
            kcalPerUnit: 3600,
            collectedThisPeriod: false,
          },
        ],
      }),
    ).toEqual({ inventoryId: "air", quantity: 10 });
  });
});
