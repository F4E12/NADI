export type PriorityLevel = "MERAH" | "KUNING" | "HIJAU";

export type TentState = {
  chronicVulnerabilityCount: number;
  activeIllnessCount: number;
  openComplaints: PriorityLevel[];
  occupancy: number;
  maxCapacity: number;
  daysOfCover: number;
};

export type Heat = {
  colour: PriorityLevel;
  reasons: string[];
};

type Contribution = { level: PriorityLevel; reason: string };

const PRIORITY_LEVELS: ReadonlyArray<{
  level: PriorityLevel;
  label: string;
  severity: number;
}> = [
  { level: "MERAH", label: "Merah", severity: 2 },
  { level: "KUNING", label: "Kuning", severity: 1 },
  { level: "HIJAU", label: "Hijau", severity: 0 },
];

const severityOf = (level: PriorityLevel) =>
  PRIORITY_LEVELS.find((p) => p.level === level)!.severity;

export const COUNT_WORTH_A_VISIT = 3;
export const CROWDED_RATIO = 0.9;
export const COVER_MERAH_DAYS = 1;
export const COVER_KUNING_DAYS = 2;

export function tentHeat(tent: TentState): Heat {
  const contributions = [
    ...chronicVulnerability(tent),
    ...activeIllness(tent),
    ...openComplaints(tent),
    ...occupancyPressure(tent),
    ...supplyShortage(tent),
  ];

  const colour = contributions.reduce<PriorityLevel>(
    (worst, c) => (severityOf(c.level) > severityOf(worst) ? c.level : worst),
    "HIJAU",
  );

  return { colour, reasons: contributions.map((c) => c.reason) };
}

function chronicVulnerability({ chronicVulnerabilityCount }: TentState): Contribution[] {
  return residentCountReason(chronicVulnerabilityCount, "with chronic conditions");
}

function activeIllness({ activeIllnessCount }: TentState): Contribution[] {
  return residentCountReason(activeIllnessCount, "currently sick");
}

function residentCountReason(count: number, description: string): Contribution[] {
  if (count === 0) return [];

  return [
    {
      level: count >= COUNT_WORTH_A_VISIT ? "KUNING" : "HIJAU",
      reason: `${count} ${count === 1 ? "resident" : "residents"} ${description}`,
    },
  ];
}

function openComplaints({ openComplaints: complaints }: TentState): Contribution[] {
  return PRIORITY_LEVELS.map(({ level, label }) => ({
    level,
    label,
    count: complaints.filter((c) => c === level).length,
  }))
    .filter(({ count }) => count > 0)
    .map(({ level, label, count }) => ({
      level,
      reason: `${count} open ${count === 1 ? "complaint" : "complaints"} at ${label}`,
    }));
}

function occupancyPressure({ occupancy, maxCapacity }: TentState): Contribution[] {
  const ratio = maxCapacity === 0 ? 0 : occupancy / maxCapacity;
  if (ratio < CROWDED_RATIO) return [];

  return [
    {
      level: ratio >= 1 ? "KUNING" : "HIJAU",
      reason: `Occupancy at ${Math.round(ratio * 100)}% of capacity`,
    },
  ];
}

function supplyShortage({ daysOfCover }: TentState): Contribution[] {
  if (daysOfCover < COVER_MERAH_DAYS) {
    return [{ level: "MERAH", reason: "Supplies under 1 day of cover" }];
  }
  if (daysOfCover < COVER_KUNING_DAYS) {
    return [{ level: "KUNING", reason: "Supplies under 2 days of cover" }];
  }
  return [];
}
