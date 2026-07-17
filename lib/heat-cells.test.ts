import { describe, expect, it } from "vitest";
import { tentHeatCells, type HeatCellInput } from "./heat-cells";

const calm: HeatCellInput = {
  chronicCount: 0,
  sickCount: 0,
  complaintCounts: { MERAH: 0, KUNING: 0, HIJAU: 0 },
  occupancy: 4,
  maxCapacity: 10,
  daysOfCover: 3,
};

const cellsOf = (overrides: Partial<HeatCellInput>) =>
  tentHeatCells({ ...calm, ...overrides });

const cell = (overrides: Partial<HeatCellInput>, key: string) =>
  cellsOf(overrides).find((c) => c.key === key)!;

describe("tentHeatCells", () => {
  it("returns the five dimensions in fixed order", () => {
    expect(cellsOf({}).map((c) => c.key)).toEqual([
      "chronic",
      "sick",
      "complaints",
      "occupancy",
      "cover",
    ]);
  });

  it("keeps a calm tent at level 0 everywhere", () => {
    expect(cellsOf({}).every((c) => c.level === 0)).toBe(true);
  });

  describe("chronic and sick counts", () => {
    it("marks 1-2 residents as level 1", () => {
      expect(cell({ chronicCount: 2 }, "chronic").level).toBe(1);
      expect(cell({ sickCount: 1 }, "sick").level).toBe(1);
    });

    it("marks 3+ residents as level 2", () => {
      expect(cell({ chronicCount: 3 }, "chronic").level).toBe(2);
      expect(cell({ sickCount: 5 }, "sick").level).toBe(2);
    });

    it("shows the count as the value", () => {
      expect(cell({ chronicCount: 3 }, "chronic").value).toBe("3");
    });
  });

  describe("complaints", () => {
    it("takes the level from the worst open complaint", () => {
      expect(
        cell({ complaintCounts: { MERAH: 0, KUNING: 0, HIJAU: 2 } }, "complaints")
          .level,
      ).toBe(1);
      expect(
        cell({ complaintCounts: { MERAH: 0, KUNING: 1, HIJAU: 2 } }, "complaints")
          .level,
      ).toBe(2);
      expect(
        cell({ complaintCounts: { MERAH: 1, KUNING: 1, HIJAU: 0 } }, "complaints")
          .level,
      ).toBe(3);
    });

    it("shows the total count as the value", () => {
      expect(
        cell({ complaintCounts: { MERAH: 1, KUNING: 2, HIJAU: 0 } }, "complaints")
          .value,
      ).toBe("3");
    });
  });

  describe("occupancy", () => {
    it("stays level 0 under 90%", () => {
      expect(cell({ occupancy: 8, maxCapacity: 10 }, "occupancy").level).toBe(0);
    });

    it("is level 1 from 90% and level 2 at full", () => {
      expect(cell({ occupancy: 9, maxCapacity: 10 }, "occupancy").level).toBe(1);
      expect(cell({ occupancy: 10, maxCapacity: 10 }, "occupancy").level).toBe(2);
    });

    it("treats zero capacity as calm", () => {
      expect(cell({ occupancy: 0, maxCapacity: 0 }, "occupancy").level).toBe(0);
    });

    it("shows the percentage as the value", () => {
      expect(cell({ occupancy: 9, maxCapacity: 10 }, "occupancy").value).toBe(
        "90%",
      );
    });
  });

  describe("days of cover", () => {
    it("is level 2 under two days and level 3 under one", () => {
      expect(cell({ daysOfCover: 1.5 }, "cover").level).toBe(2);
      expect(cell({ daysOfCover: 0.4 }, "cover").level).toBe(3);
    });

    it("shows one decimal, or infinity", () => {
      expect(cell({ daysOfCover: 1.53 }, "cover").value).toBe("1.5");
      expect(cell({ daysOfCover: Infinity }, "cover").value).toBe("∞");
    });
  });

  it("gives every cell a readable detail sentence", () => {
    for (const c of cellsOf({ chronicCount: 2, daysOfCover: 0.5 })) {
      expect(c.detail.length).toBeGreaterThan(0);
    }
  });
});
