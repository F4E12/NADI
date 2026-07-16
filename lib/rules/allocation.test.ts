import { describe, expect, it } from "vitest";
import {
  allocationDecision,
  daysOfCover,
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
