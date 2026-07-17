import { describe, expect, it } from "vitest";
import { extractSymptoms } from "./index";
import { qvacExtractor } from "./qvac";
import { classifyComplaint } from "@/lib/rules/classification";

const weights = process.env.QVAC_MODEL_PATH;

describe.runIf(weights)("QVAC end to end", () => {
  it(
    "selects the model, extracts catalog labels, and the rules still classify",
    { timeout: 180_000 },
    async () => {
      expect(await qvacExtractor.isAvailable()).toBe(true);

      const result = await extractSymptoms("dada saya sesak, sudah dua hari");
      expect(result.provider).toBe("QVAC (model on-device)");
      expect(result.isModel).toBe(true);
      expect(result.symptoms.length).toBeGreaterThan(0);
      expect(result.symptoms).toContain("Sesak napas");

      const priority = classifyComplaint(result.symptoms);
      expect(["MERAH", "KUNING", "HIJAU"]).toContain(priority);
    },
  );
});

describe("broken weights degrade to the keyword fallback", () => {
  it(
    "answers via keywords when QVAC_MODEL_PATH points at a non-model file",
    { timeout: 60_000 },
    async () => {
      const saved = process.env.QVAC_MODEL_PATH;
      process.env.QVAC_MODEL_PATH = new URL(import.meta.url).pathname;
      try {
        expect(await qvacExtractor.isAvailable()).toBe(true);
        const result = await extractSymptoms("dada saya sesak");
        expect(result.isModel).toBe(false);
        expect(result.provider).toBe("Pencocokan kata kunci (bukan model)");
        expect(result.symptoms).toContain("Sesak napas");
      } finally {
        if (saved) process.env.QVAC_MODEL_PATH = saved;
        else delete process.env.QVAC_MODEL_PATH;
      }
    },
  );
});

describe("keyword fallback without the model", () => {
  it("answers when QVAC_MODEL_PATH is unset", async () => {
    const saved = process.env.QVAC_MODEL_PATH;
    delete process.env.QVAC_MODEL_PATH;
    try {
      expect(await qvacExtractor.isAvailable()).toBe(false);
      const result = await extractSymptoms("dada saya sesak, badan demam");
      expect(result.isModel).toBe(false);
      expect(result.provider).toBe("Pencocokan kata kunci (bukan model)");
      expect(result.symptoms).toContain("Sesak napas");
      expect(result.symptoms).toContain("Demam tinggi");
    } finally {
      if (saved) process.env.QVAC_MODEL_PATH = saved;
    }
  });
});
