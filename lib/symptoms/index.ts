import type { SymptomExtraction, SymptomExtractor } from "./extractor";
import { keywordExtractor } from "./keyword";
import { qvacExtractor } from "./qvac";

const PROVIDERS: SymptomExtractor[] = [qvacExtractor, keywordExtractor];

async function activeExtractor(): Promise<SymptomExtractor> {
  for (const provider of PROVIDERS) {
    if (await provider.isAvailable()) return provider;
  }
  return keywordExtractor;
}

export async function extractSymptoms(freeText: string): Promise<SymptomExtraction> {
  const text = freeText.trim();
  const extractor = await activeExtractor();
  if (!text) {
    return { provider: extractor.name, isModel: extractor.isModel, symptoms: [] };
  }
  return {
    provider: extractor.name,
    isModel: extractor.isModel,
    symptoms: await extractor.extract(text),
  };
}
