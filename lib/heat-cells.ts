import {
  COUNT_WORTH_A_VISIT,
  COVER_KUNING_DAYS,
  COVER_MERAH_DAYS,
  CROWDED_RATIO,
  type PriorityLevel,
} from "@/lib/rules/heat";
import { priorityLabel } from "@/lib/format";

export type HeatCellLevel = 0 | 1 | 2 | 3;

export type HeatCellKey =
  | "chronic"
  | "sick"
  | "complaints"
  | "occupancy"
  | "cover";

export type HeatCell = {
  key: HeatCellKey;
  value: string;
  level: HeatCellLevel;
  detail: string;
};

export type HeatCellInput = {
  chronicCount: number;
  sickCount: number;
  complaintCounts: Record<PriorityLevel, number>;
  occupancy: number;
  maxCapacity: number;
  daysOfCover: number;
};

const WORST_FIRST: PriorityLevel[] = ["MERAH", "KUNING", "HIJAU"];

export function tentHeatCells(input: HeatCellInput): HeatCell[] {
  return [
    residentCountCell("chronic", input.chronicCount, "dengan kondisi kronis"),
    residentCountCell("sick", input.sickCount, "sedang sakit"),
    complaintsCell(input.complaintCounts),
    occupancyCell(input.occupancy, input.maxCapacity),
    coverCell(input.daysOfCover),
  ];
}

function residentCountCell(
  key: HeatCellKey,
  count: number,
  description: string,
): HeatCell {
  const level: HeatCellLevel =
    count === 0 ? 0 : count >= COUNT_WORTH_A_VISIT ? 2 : 1;
  return {
    key,
    value: String(count),
    level,
    detail:
      count === 0 ? `Tidak ada warga ${description}` : `${count} warga ${description}`,
  };
}

function complaintsCell(counts: Record<PriorityLevel, number>): HeatCell {
  const total = WORST_FIRST.reduce((sum, p) => sum + counts[p], 0);
  const worst = WORST_FIRST.find((p) => counts[p] > 0);
  const level = (worst ? 3 - WORST_FIRST.indexOf(worst) : 0) as HeatCellLevel;
  return {
    key: "complaints",
    value: String(total),
    level,
    detail:
      worst === undefined
        ? "Tidak ada keluhan terbuka"
        : `${total} keluhan terbuka, terberat ${priorityLabel(worst)}`,
  };
}

function occupancyCell(occupancy: number, maxCapacity: number): HeatCell {
  const ratio = maxCapacity === 0 ? 0 : occupancy / maxCapacity;
  const pct = Math.round(ratio * 100);
  const level: HeatCellLevel = ratio >= 1 ? 2 : ratio >= CROWDED_RATIO ? 1 : 0;
  return {
    key: "occupancy",
    value: `${pct}%`,
    level,
    detail: `Okupansi ${occupancy}/${maxCapacity} orang (${pct}%)`,
  };
}

function coverCell(daysOfCover: number): HeatCell {
  const level: HeatCellLevel =
    daysOfCover < COVER_MERAH_DAYS ? 3 : daysOfCover < COVER_KUNING_DAYS ? 2 : 0;
  const value = Number.isFinite(daysOfCover) ? daysOfCover.toFixed(1) : "∞";
  return {
    key: "cover",
    value,
    level,
    detail: Number.isFinite(daysOfCover)
      ? `Pasokan cukup untuk ${daysOfCover.toFixed(1)} hari`
      : "Pasokan melimpah",
  };
}
