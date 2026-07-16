import { describe, expect, it } from "vitest";
import { tentHeat, type TentState } from "./heat";

const CALM: TentState = {
  chronicVulnerabilityCount: 0,
  activeIllnessCount: 0,
  openComplaints: [],
  occupancy: 10,
  maxCapacity: 100,
  daysOfCover: 5,
};

const reasonsOf = (state: Partial<TentState>) =>
  tentHeat({ ...CALM, ...state }).reasons;

describe("tentHeat", () => {
  it("stays green and reasonless when nothing presses", () => {
    expect(tentHeat(CALM)).toEqual({ colour: "HIJAU", reasons: [] });
  });

  it("never emits a bare score — only named reasons", () => {
    const heat = tentHeat({ ...CALM, activeIllnessCount: 4 });
    expect(heat).toHaveProperty("reasons");
    expect(Array.isArray(heat.reasons)).toBe(true);
    expect(heat).not.toHaveProperty("score");
  });

  it("counts chronic vulnerability and active illness separately, not double", () => {
    const reasons = reasonsOf({ chronicVulnerabilityCount: 3, activeIllnessCount: 5 });
    expect(reasons).toContain("3 residents with chronic conditions");
    expect(reasons).toContain("5 residents currently sick");
    expect(reasons.filter((r) => r.includes("chronic")).length).toBe(1);
    expect(reasons.filter((r) => r.includes("sick")).length).toBe(1);
  });

  it("each input contributes its own named reason", () => {
    const heat = tentHeat({
      chronicVulnerabilityCount: 3,
      activeIllnessCount: 3,
      openComplaints: ["MERAH"],
      occupancy: 100,
      maxCapacity: 100,
      daysOfCover: 0.5,
    });
    expect(heat.reasons).toContain("3 residents with chronic conditions");
    expect(heat.reasons).toContain("3 residents currently sick");
    expect(heat.reasons).toContain("1 open complaint at Merah");
    expect(heat.reasons).toContain("Occupancy at 100% of capacity");
    expect(heat.reasons).toContain("Supplies under 1 day of cover");
    expect(heat.colour).toBe("MERAH");
  });

  it("raises its own reason when a tent's supply runs down", () => {
    expect(reasonsOf({ daysOfCover: 0.5 })).toContain("Supplies under 1 day of cover");
    expect(reasonsOf({ daysOfCover: 1.5 })).toContain("Supplies under 2 days of cover");
    expect(reasonsOf({ daysOfCover: 3 })).not.toContain("Supplies under 2 days of cover");
  });

  it("changes when a Complaint is confirmed — open complaint becomes active illness", () => {
    const before = tentHeat({ ...CALM, openComplaints: ["MERAH"] });
    const after = tentHeat({ ...CALM, openComplaints: [], activeIllnessCount: 1 });

    expect(before.reasons).toContain("1 open complaint at Merah");
    expect(after.reasons).not.toContain("1 open complaint at Merah");
    expect(after.reasons).toContain("1 resident currently sick");
    expect(before.reasons).not.toEqual(after.reasons);
  });
});
