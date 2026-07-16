import type { Symptom } from "@/lib/rules/classification";
import { SYMPTOM_CATALOG } from "@/lib/rules/classification";

export type SymptomExtraction = {
  provider: string;
  isModel: boolean;
  symptoms: string[];
};

export type SymptomExtractor = {
  name: string;
  isModel: boolean;
  isAvailable: () => Promise<boolean>;
  extract: (freeText: string) => Promise<string[]>;
};

const CATALOG_ORDER = new Map(SYMPTOM_CATALOG.map((s, i) => [s.label, i]));

export function normaliseSymptoms(labels: string[]): string[] {
  const valid = new Set<string>();
  for (const label of labels) {
    if (CATALOG_ORDER.has(label)) valid.add(label);
  }
  return [...valid].sort(
    (a, b) => (CATALOG_ORDER.get(a) ?? 0) - (CATALOG_ORDER.get(b) ?? 0),
  );
}

export type { Symptom };
