import { normaliseSymptoms, type SymptomExtractor } from "./extractor";
import { SYMPTOM_CATALOG } from "@/lib/rules/classification";

const QVAC_PACKAGE = ["@qvac", "sdk"].join("/");

async function loadSdk(): Promise<unknown | null> {
  try {
    return await import(/* @vite-ignore */ QVAC_PACKAGE);
  } catch {
    return null;
  }
}

const CATALOG_LABELS = SYMPTOM_CATALOG.map((s) => s.label);

export const qvacExtractor: SymptomExtractor = {
  name: "QVAC (model on-device)",
  isModel: true,

  isAvailable: async () => {
    if (!process.env.QVAC_MODEL_PATH) return false;
    return (await loadSdk()) !== null;
  },

  extract: async (freeText) => {
    const sdk = (await loadSdk()) as
      | { createSession?: (opts: { modelPath: string }) => Promise<QvacSession> }
      | null;
    if (!sdk?.createSession) return [];

    const session = await sdk.createSession({
      modelPath: process.env.QVAC_MODEL_PATH as string,
    });
    try {
      const prompt = [
        "Anda mengekstrak gejala dari keluhan warga. Jangan mendiagnosis.",
        `Pilih hanya dari daftar ini: ${CATALOG_LABELS.join(", ")}.`,
        "Kembalikan array JSON label yang cocok, tanpa teks lain.",
        `Keluhan: "${freeText}"`,
      ].join("\n");
      const raw = await session.complete(prompt);
      return normaliseSymptoms(parseLabels(raw));
    } finally {
      await session.close?.();
    }
  },
};

type QvacSession = {
  complete: (prompt: string) => Promise<string>;
  close?: () => Promise<void>;
};

function parseLabels(raw: string): string[] {
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
