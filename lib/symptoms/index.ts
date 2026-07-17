import type { SymptomExtraction, SymptomExtractor } from "./extractor";
import { keywordExtractor } from "./keyword";
import { qvacExtractor } from "./qvac";

const PROVIDERS: SymptomExtractor[] = [qvacExtractor, keywordExtractor];

export async function extractSymptoms(freeText: string): Promise<SymptomExtraction> {
  const text = freeText.trim();
  for (const provider of PROVIDERS) {
    if (!(await provider.isAvailable())) continue;
    try {
      return {
        provider: provider.name,
        isModel: provider.isModel,
        symptoms: text ? await provider.extract(text) : [],
      };
    } catch {
      continue;
    }
  }
  return {
    provider: keywordExtractor.name,
    isModel: keywordExtractor.isModel,
    symptoms: text ? await keywordExtractor.extract(text) : [],
  };
}
