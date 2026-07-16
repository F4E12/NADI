import type { PriorityLevel } from "./heat";

export type Symptom = { label: string; level: PriorityLevel };

export const SYMPTOM_CATALOG: readonly Symptom[] = [
  { label: "Sesak napas", level: "MERAH" },
  { label: "Nyeri dada", level: "MERAH" },
  { label: "Keringat dingin", level: "MERAH" },
  { label: "Dehidrasi", level: "MERAH" },
  { label: "Diare berat", level: "MERAH" },
  { label: "Kejang", level: "MERAH" },
  { label: "Penurunan kesadaran", level: "MERAH" },
  { label: "Perdarahan hebat", level: "MERAH" },
  { label: "Demam tinggi", level: "KUNING" },
  { label: "Muntah berulang", level: "KUNING" },
  { label: "Pusing", level: "KUNING" },
  { label: "Lemas", level: "KUNING" },
  { label: "Nyeri perut", level: "KUNING" },
  { label: "Luka terbuka", level: "KUNING" },
  { label: "Batuk", level: "HIJAU" },
  { label: "Pilek", level: "HIJAU" },
  { label: "Sakit tenggorokan", level: "HIJAU" },
  { label: "Sakit kepala ringan", level: "HIJAU" },
  { label: "Ruam kulit", level: "HIJAU" },
  { label: "Nafsu makan menurun", level: "HIJAU" },
];

const RANK: Record<PriorityLevel, number> = { MERAH: 2, KUNING: 1, HIJAU: 0 };

const levelOf = (label: string): PriorityLevel =>
  SYMPTOM_CATALOG.find((s) => s.label === label)?.level ?? "HIJAU";

export function classifyComplaint(symptomLabels: string[]): PriorityLevel {
  return symptomLabels.reduce<PriorityLevel>(
    (worst, label) => (RANK[levelOf(label)] > RANK[worst] ? levelOf(label) : worst),
    "HIJAU",
  );
}
