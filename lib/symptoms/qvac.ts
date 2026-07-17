import { existsSync } from "node:fs";
import { normaliseSymptoms, type SymptomExtractor } from "./extractor";
import { SYMPTOM_CATALOG } from "@/lib/rules/classification";

type QvacSdk = {
  loadModel: (opts: {
    modelSrc: string;
    modelType: "llamacpp-completion";
    modelConfig?: { ctx_size?: number };
  }) => Promise<string>;
  completion: (opts: {
    modelId: string;
    history: { role: "user"; content: string }[];
    stream: boolean;
    captureThinking?: boolean;
    generationParams?: { temp?: number };
  }) => { final: Promise<{ contentText: string }> };
};

async function loadSdk(): Promise<QvacSdk | null> {
  try {
    const sdk = (await import("@qvac/sdk")) as Partial<QvacSdk>;
    return sdk.loadModel && sdk.completion ? (sdk as QvacSdk) : null;
  } catch {
    return null;
  }
}

function weightsPath(): string | null {
  const path = process.env.QVAC_MODEL_PATH;
  return path && existsSync(path) ? path : null;
}

type QvacRuntime = { sdk: QvacSdk; modelId: string };

let cached: { path: string; runtime: Promise<QvacRuntime | null> } | null = null;

function runtime(): Promise<QvacRuntime | null> {
  const path = weightsPath();
  if (!path) return Promise.resolve(null);
  if (cached?.path !== path) {
    const entry = {
      path,
      runtime: (async () => {
        const sdk = await loadSdk();
        if (!sdk) return null;
        const modelId = await sdk.loadModel({
          modelSrc: path,
          modelType: "llamacpp-completion",
          modelConfig: { ctx_size: 2048 },
        });
        return { sdk, modelId };
      })(),
    };
    entry.runtime = entry.runtime.catch(() => {
      if (cached === entry) cached = null;
      return null;
    });
    cached = entry;
  }
  return cached.runtime;
}

const CATALOG_LABELS = SYMPTOM_CATALOG.map((s) => s.label);

function extractionPrompt(freeText: string): string {
  return [
    "Anda mengekstrak gejala dari keluhan warga. Jangan mendiagnosis.",
    `Pilih hanya dari daftar ini: ${CATALOG_LABELS.join(", ")}.`,
    "Hanya pilih gejala yang benar-benar disebutkan dalam keluhan.",
    "Kembalikan array JSON label yang cocok, tanpa teks lain. /no_think",
    `Keluhan: "${freeText}"`,
  ].join("\n");
}

export const qvacExtractor: SymptomExtractor = {
  name: "QVAC (model on-device)",
  isModel: true,

  isAvailable: async () => {
    if (!weightsPath()) return false;
    return (await loadSdk()) !== null;
  },

  extract: async (freeText) => {
    const active = await runtime();
    if (!active) throw new Error("QVAC runtime unavailable");
    const result = active.sdk.completion({
      modelId: active.modelId,
      history: [{ role: "user", content: extractionPrompt(freeText) }],
      stream: true,
      captureThinking: true,
      generationParams: { temp: 0 },
    });
    const final = await result.final;
    return normaliseSymptoms(parseLabels(final.contentText));
  },
};

export function parseLabels(raw: string): string[] {
  try {
    const match = raw.match(/\[[\s\S]*?\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
