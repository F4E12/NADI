import { describe, expect, it } from "vitest";
import { SYMPTOM_CATALOG, classifyComplaint } from "./classification";

describe("classifyComplaint", () => {
  it("is deterministic — the same symptoms always produce the same call", () => {
    const symptoms = ["Demam tinggi", "Batuk"];
    expect(classifyComplaint(symptoms)).toBe(classifyComplaint(symptoms));
    expect(classifyComplaint(symptoms)).toBe("KUNING");
  });

  it("takes the worst symptom's level", () => {
    expect(classifyComplaint(["Sesak napas"])).toBe("MERAH");
    expect(classifyComplaint(["Batuk", "Sesak napas"])).toBe("MERAH");
    expect(classifyComplaint(["Batuk", "Pilek"])).toBe("HIJAU");
  });

  it("is order-independent", () => {
    expect(classifyComplaint(["Batuk", "Demam tinggi", "Nyeri dada"])).toBe(
      classifyComplaint(["Nyeri dada", "Batuk", "Demam tinggi"]),
    );
  });

  it("treats an unrecognised symptom as the lowest level, never inflating", () => {
    expect(classifyComplaint(["sesuatu yang aneh"])).toBe("HIJAU");
    expect(classifyComplaint(["Batuk", "entah apa"])).toBe("HIJAU");
  });

  it("returns the lowest level for no symptoms", () => {
    expect(classifyComplaint([])).toBe("HIJAU");
  });

  it("every catalog entry classifies to its own level in isolation", () => {
    for (const s of SYMPTOM_CATALOG) {
      expect(classifyComplaint([s.label])).toBe(s.level);
    }
  });
});
