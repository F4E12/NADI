import { formatDaysOfCover, priorityLabel } from "@/lib/format";
import type { PoskoCoverage, ShortageItem } from "@/lib/report/report";

export type SummaryHeader = {
  poskoName: string;
  location: string;
  preparedBy: string;
};

export type SummaryInput = {
  header: SummaryHeader;
  generatedAtLabel: string;
  coverage: PoskoCoverage;
  tents: { name: string; headcount: number }[];
  shortages: ShortageItem[];
};

function blankable(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "—";
}

export function buildSummaryText(input: SummaryInput): string {
  const { header, coverage, tents, shortages } = input;
  const lines: string[] = [];

  lines.push(`LAPORAN POSKO — ${blankable(header.poskoName)}`);
  if (header.location.trim()) lines.push(blankable(header.location));
  lines.push(input.generatedAtLabel);
  lines.push("");

  lines.push(
    `Total pengungsi: ${coverage.population} jiwa (${tents.length} tenda)`,
  );
  lines.push(
    `Cakupan pangan: ${formatDaysOfCover(coverage.daysOfCover)} [${priorityLabel(coverage.colour)}]`,
  );
  lines.push("");

  lines.push("Per tenda:");
  for (const tent of tents) {
    lines.push(`- ${tent.name}: ${tent.headcount} jiwa`);
  }
  lines.push("");

  lines.push("Kebutuhan stok:");
  const habis = shortages.filter((s) => s.status === "HABIS");
  const menipis = shortages.filter((s) => s.status === "MENIPIS");
  if (habis.length === 0 && menipis.length === 0) {
    lines.push("- Stok memadai, tidak ada kekurangan kritis.");
  } else {
    if (habis.length > 0) {
      lines.push(`- Habis: ${habis.map((s) => s.name).join(", ")}`);
    }
    for (const item of menipis) {
      const cover =
        item.daysOfCover !== null ? ` (~${formatDaysOfCover(item.daysOfCover)})` : "";
      lines.push(`- Menipis: ${item.name}${cover}`);
    }
  }

  if (header.preparedBy.trim()) {
    lines.push("");
    lines.push(`Disiapkan oleh: ${header.preparedBy.trim()}`);
  }

  return lines.join("\n");
}
