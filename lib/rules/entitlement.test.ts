import { describe, expect, it } from "vitest";
import {
  householdEntitlement,
  residentEntitlement,
  tentEntitlement,
} from "./entitlement";

describe("residentEntitlement", () => {
  it("derives AKG from the age band, not headcount", () => {
    expect(residentEntitlement({ age: 30, isPregnant: false }).kcalPerDay).toBe(2200);
    expect(residentEntitlement({ age: 8, isPregnant: false }).kcalPerDay).toBe(1600);
    expect(residentEntitlement({ age: 70, isPregnant: false }).kcalPerDay).toBe(1800);
  });

  it("owes a toddler materially less than an adult", () => {
    const toddler = residentEntitlement({ age: 2, isPregnant: false });
    const adult = residentEntitlement({ age: 30, isPregnant: false });

    expect(toddler.kcalPerDay).toBe(1350);
    expect(toddler.kcalPerDay).toBeLessThan(adult.kcalPerDay);
  });

  it("adds a pregnancy surcharge on top of the age band", () => {
    const carrying = residentEntitlement({ age: 30, isPregnant: true });
    const notCarrying = residentEntitlement({ age: 30, isPregnant: false });

    expect(carrying.kcalPerDay - notCarrying.kcalPerDay).toBe(300);
    expect(carrying.kcalPerDay).toBe(2500);
  });

  it("tracks clean water alongside nutrition for every resident", () => {
    expect(residentEntitlement({ age: 2, isPregnant: false }).cleanWaterLitresPerDay).toBe(15);
    expect(residentEntitlement({ age: 30, isPregnant: true }).cleanWaterLitresPerDay).toBe(15);
  });
});

describe("householdEntitlement", () => {
  it("rolls up its residents' nutrition and water", () => {
    const household = householdEntitlement([
      { age: 30, isPregnant: false },
      { age: 28, isPregnant: false },
      { age: 2, isPregnant: false },
    ]);

    expect(household.kcalPerDay).toBe(2200 + 2200 + 1350);
    expect(household.cleanWaterLitresPerDay).toBe(45);
  });

  it("owes more when a resident is pregnant — the difference is the point", () => {
    const withPregnancy = householdEntitlement([
      { age: 30, isPregnant: true },
      { age: 2, isPregnant: false },
    ]);
    const withoutPregnancy = householdEntitlement([
      { age: 30, isPregnant: false },
      { age: 2, isPregnant: false },
    ]);

    expect(withPregnancy.kcalPerDay).toBeGreaterThan(withoutPregnancy.kcalPerDay);
    expect(withPregnancy.kcalPerDay - withoutPregnancy.kcalPerDay).toBe(300);
  });

  it("owes an empty household nothing", () => {
    expect(householdEntitlement([])).toEqual({
      kcalPerDay: 0,
      cleanWaterLitresPerDay: 0,
    });
  });
});

describe("tentEntitlement", () => {
  it("aggregates the requirement across its households", () => {
    const a = householdEntitlement([{ age: 30, isPregnant: false }]);
    const b = householdEntitlement([
      { age: 30, isPregnant: true },
      { age: 2, isPregnant: false },
    ]);

    const tent = tentEntitlement([a, b]);

    expect(tent.kcalPerDay).toBe(a.kcalPerDay + b.kcalPerDay);
    expect(tent.cleanWaterLitresPerDay).toBe(
      a.cleanWaterLitresPerDay + b.cleanWaterLitresPerDay,
    );
  });
});
