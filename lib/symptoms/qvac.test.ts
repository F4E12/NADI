import { describe, expect, it } from "vitest";
import { parseLabels } from "./qvac";
import { normaliseSymptoms } from "./extractor";

describe("parseLabels", () => {
  it("parses a bare JSON array", () => {
    expect(parseLabels('["Sesak napas", "Demam tinggi"]')).toEqual([
      "Sesak napas",
      "Demam tinggi",
    ]);
  });

  it("parses an array embedded in prose", () => {
    expect(
      parseLabels('Berikut gejalanya: ["Nyeri dada"] sesuai daftar.'),
    ).toEqual(["Nyeri dada"]);
  });

  it("returns empty on invalid JSON", () => {
    expect(parseLabels("[Sesak napas]")).toEqual([]);
  });

  it("returns empty when no array present", () => {
    expect(parseLabels("Tidak ada gejala yang cocok.")).toEqual([]);
  });

  it("returns empty on a non-array JSON value", () => {
    expect(parseLabels('{"labels": []}')).toEqual([]);
  });
});

describe("model output through the catalog boundary", () => {
  it("drops labels the catalog does not know", () => {
    expect(
      normaliseSymptoms(parseLabels('["Sesak napas", "Serangan jantung"]')),
    ).toEqual(["Sesak napas"]);
  });

  it("orders and dedupes catalog labels", () => {
    expect(
      normaliseSymptoms(parseLabels('["Demam tinggi", "Sesak napas", "Demam tinggi"]')),
    ).toEqual(["Sesak napas", "Demam tinggi"]);
  });
});
