import { describe, expect, it } from "vitest";
import {
  classifyShortages,
  coverageColour,
  itemDaysOfCover,
  poskoCoverage,
  residentFlags,
  SHORTAGE_LOW_DAYS,
  type StockLevel,
} from "@/lib/report/report";

const stock = (over: Partial<StockLevel>): StockLevel => ({
  name: "Beras",
  unit: "kg",
  category: "Pangan",
  central: 100,
  total: 100,
  kcalPerUnit: 3500,
  ...over,
});

describe("residentFlags", () => {
  it("is empty for a well, non-pregnant resident with no conditions", () => {
    expect(
      residentFlags({ isPregnant: false, healthStatus: "WELL", chronicConditions: [] }),
    ).toEqual([]);
  });

  it("surfaces pregnancy, illness, and chronic conditions in order", () => {
    expect(
      residentFlags({
        isPregnant: true,
        healthStatus: "SICK",
        chronicConditions: ["Diabetes", "Hipertensi"],
      }),
    ).toEqual(["Hamil", "Sakit", "Diabetes", "Hipertensi"]);
  });

  it("labels RECOVERING as Pemulihan and ignores WELL", () => {
    expect(
      residentFlags({ isPregnant: false, healthStatus: "RECOVERING", chronicConditions: [] }),
    ).toEqual(["Pemulihan"]);
  });
});

describe("itemDaysOfCover", () => {
  it("returns null for non-food items", () => {
    expect(itemDaysOfCover({ total: 50, kcalPerUnit: 0 }, 10_000)).toBeNull();
  });

  it("returns null when there is no demand", () => {
    expect(itemDaysOfCover({ total: 50, kcalPerUnit: 3500 }, 0)).toBeNull();
  });

  it("divides total kcal on hand by daily demand", () => {
    expect(itemDaysOfCover({ total: 2, kcalPerUnit: 1000 }, 1000)).toBe(2);
  });
});

describe("classifyShortages", () => {
  it("flags depleted central pool as HABIS regardless of category", () => {
    const result = classifyShortages([stock({ central: 0, total: 0, kcalPerUnit: 0 })], 10_000);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("HABIS");
  });

  it("flags thin food stock under the low-cover threshold as MENIPIS", () => {
    const result = classifyShortages(
      [stock({ central: 1, total: 1, kcalPerUnit: 1000 })],
      1000,
    );
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("MENIPIS");
    expect(result[0].daysOfCover).toBe(1);
  });

  it("does not flag food with comfortable cover", () => {
    const result = classifyShortages(
      [stock({ central: 10, total: 10, kcalPerUnit: 1000 })],
      1000,
    );
    expect(result).toEqual([]);
  });

  it("never flags well-stocked non-food as MENIPIS", () => {
    const result = classifyShortages(
      [stock({ name: "Selimut", central: 5, total: 5, kcalPerUnit: 0 })],
      10_000,
    );
    expect(result).toEqual([]);
  });

  it("orders HABIS before MENIPIS, then by ascending cover", () => {
    const result = classifyShortages(
      [
        stock({ name: "Minyak", central: 2, total: 2, kcalPerUnit: 500 }),
        stock({ name: "Gula", central: 0, total: 0, kcalPerUnit: 0 }),
        stock({ name: "Beras", central: 1, total: 1, kcalPerUnit: 500 }),
      ],
      1000,
    );
    expect(result.map((r) => r.name)).toEqual(["Gula", "Beras", "Minyak"]);
  });

  it("uses the two-day threshold from the heat rules", () => {
    expect(SHORTAGE_LOW_DAYS).toBe(2);
  });
});

describe("coverageColour", () => {
  it("is MERAH under one day", () => {
    expect(coverageColour(0.5)).toBe("MERAH");
  });
  it("is KUNING between one and two days", () => {
    expect(coverageColour(1.5)).toBe("KUNING");
  });
  it("is HIJAU at two days or more", () => {
    expect(coverageColour(2)).toBe("HIJAU");
  });
});

describe("poskoCoverage", () => {
  it("computes days of cover from demand and stock on hand", () => {
    const c = poskoCoverage({ population: 10, kcalPerDay: 20_000, kcalOnHand: 30_000 });
    expect(c.daysOfCover).toBe(1.5);
    expect(c.colour).toBe("KUNING");
  });

  it("treats zero demand as infinite cover", () => {
    const c = poskoCoverage({ population: 0, kcalPerDay: 0, kcalOnHand: 0 });
    expect(c.daysOfCover).toBe(Infinity);
    expect(c.colour).toBe("HIJAU");
  });
});
