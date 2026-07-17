import { describe, expect, it } from "vitest";
import { buildSummaryText } from "@/lib/report/summary-text";
import { poskoCoverage, type ShortageItem } from "@/lib/report/report";

const baseInput = {
  header: { poskoName: "Cimahi 2", location: "Lapangan Merdeka", preparedBy: "Budi" },
  generatedAtLabel: "17 Juli 2026, 09.30",
  coverage: poskoCoverage({ population: 340, kcalPerDay: 700_000, kcalOnHand: 1_260_000 }),
  tents: [
    { name: "Tenda A", headcount: 200 },
    { name: "Tenda B", headcount: 140 },
  ],
  shortages: [] as ShortageItem[],
};

describe("buildSummaryText", () => {
  it("leads with posko identity, headcount, and coverage band", () => {
    const text = buildSummaryText(baseInput);
    expect(text).toContain("LAPORAN POSKO — Cimahi 2");
    expect(text).toContain("Lapangan Merdeka");
    expect(text).toContain("Total pengungsi: 340 jiwa (2 tenda)");
    expect(text).toContain("Cakupan pangan: 1.8 hari [Kuning]");
  });

  it("lists every tent headcount", () => {
    const text = buildSummaryText(baseInput);
    expect(text).toContain("- Tenda A: 200 jiwa");
    expect(text).toContain("- Tenda B: 140 jiwa");
  });

  it("declares stock adequate when nothing is short", () => {
    expect(buildSummaryText(baseInput)).toContain(
      "Stok memadai, tidak ada kekurangan kritis.",
    );
  });

  it("groups depleted items and lists thin items with cover", () => {
    const text = buildSummaryText({
      ...baseInput,
      shortages: [
        { name: "Beras", unit: "kg", central: 0, total: 0, status: "HABIS", daysOfCover: null },
        { name: "Minyak", unit: "L", central: 0, total: 0, status: "HABIS", daysOfCover: null },
        { name: "Air", unit: "L", central: 5, total: 5, status: "MENIPIS", daysOfCover: 1.3 },
      ],
    });
    expect(text).toContain("- Habis: Beras, Minyak");
    expect(text).toContain("- Menipis: Air (~1.3 hari)");
  });

  it("omits blank optional header fields but keeps posko placeholder", () => {
    const text = buildSummaryText({
      ...baseInput,
      header: { poskoName: "", location: "", preparedBy: "" },
    });
    expect(text).toContain("LAPORAN POSKO — —");
    expect(text).not.toContain("Disiapkan oleh");
  });
});
