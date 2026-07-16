"use client";

import type { ResidentInput } from "./actions";

type HealthStatus = "WELL" | "SICK" | "RECOVERING";

export type ResidentDraft = {
  name: string;
  age: string;
  nik: string;
  isPregnant: boolean;
  healthStatus: HealthStatus;
  chronic: string;
};

export const emptyResident = (): ResidentDraft => ({
  name: "",
  age: "",
  nik: "",
  isPregnant: false,
  healthStatus: "WELL",
  chronic: "",
});

export function draftToInput(d: ResidentDraft): ResidentInput {
  return {
    name: d.name,
    age: d.age,
    nik: d.nik,
    isPregnant: d.isPregnant,
    healthStatus: d.healthStatus,
    chronicConditions: d.chronic
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0),
  };
}

const HEALTH_LABELS: Record<HealthStatus, string> = {
  WELL: "Sehat",
  SICK: "Sakit",
  RECOVERING: "Pemulihan",
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";

export function ResidentFields({
  value,
  index,
  onChange,
  onRemove,
  removable,
}: {
  value: ResidentDraft;
  index: number;
  onChange: (next: ResidentDraft) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const set = <K extends keyof ResidentDraft>(key: K, v: ResidentDraft[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Resident {index + 1}
        </legend>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-zinc-500 hover:text-red-600"
          >
            Hapus
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Nama</span>
          <input
            className={inputClass}
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nama lengkap"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Umur (tahun)</span>
          <input
            className={inputClass}
            type="number"
            min={0}
            max={120}
            value={value.age}
            onChange={(e) => set("age", e.target.value)}
            placeholder="mis. 34"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            NIK <span className="text-zinc-400">(opsional, hanya tampilan)</span>
          </span>
          <input
            className={inputClass}
            value={value.nik}
            onChange={(e) => set("nik", e.target.value)}
            placeholder="16 digit"
            inputMode="numeric"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Status kesehatan</span>
          <select
            className={inputClass}
            value={value.healthStatus}
            onChange={(e) => set("healthStatus", e.target.value as HealthStatus)}
          >
            {(Object.keys(HEALTH_LABELS) as HealthStatus[]).map((s) => (
              <option key={s} value={s}>
                {HEALTH_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-zinc-600 dark:text-zinc-400">
            Kondisi kronis{" "}
            <span className="text-zinc-400">(pisahkan dengan koma)</span>
          </span>
          <input
            className={inputClass}
            value={value.chronic}
            onChange={(e) => set("chronic", e.target.value)}
            placeholder="mis. Asma, Hipertensi"
          />
        </label>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={value.isPregnant}
            onChange={(e) => set("isPregnant", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-zinc-600 dark:text-zinc-400">
            Sedang hamil (menambah kebutuhan gizi & membuka stok tinggi protein
            untuk Tenda)
          </span>
        </label>
      </div>
    </fieldset>
  );
}
