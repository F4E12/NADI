"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registerHousehold } from "../actions";
import {
  ResidentFields,
  draftToInput,
  emptyResident,
  type ResidentDraft,
} from "../resident-fields";
import type { TentOption } from "@/lib/data/tents";

export function NewHouseholdForm({
  tents,
  initialName,
}: {
  tents: TentOption[];
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [tentId, setTentId] = useState(tents[0]?.id ?? "");
  const [residents, setResidents] = useState<ResidentDraft[]>([emptyResident()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateResident = (i: number, next: ResidentDraft) =>
    setResidents((rs) => rs.map((r, j) => (j === i ? next : r)));
  const removeResident = (i: number) =>
    setResidents((rs) => rs.filter((_, j) => j !== i));
  const addResident = () => setResidents((rs) => [...rs, emptyResident()]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await registerHousehold({
        name,
        tentId,
        residents: residents.map(draftToInput),
      });
      if (result.ok) {
        router.push(`/households/${result.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-graphite">Nama keluarga</span>
          <input
            className="w-full rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-lavender"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Wijaya"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-graphite">Tenda</span>
          <select
            className="w-full rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-lavender"
            value={tentId}
            onChange={(e) => setTentId(e.target.value)}
          >
            {tents.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {residents.map((r, i) => (
          <ResidentFields
            key={i}
            index={i}
            value={r}
            onChange={(next) => updateResident(i, next)}
            onRemove={() => removeResident(i)}
            removable={residents.length > 1}
          />
        ))}
        <button
          type="button"
          onClick={addResident}
          className="self-start rounded-lg border border-fog px-3 py-2 text-sm hover:border-ash"
        >
          + Tambah Resident
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-lavender px-5 py-2.5 text-sm font-medium text-white hover:bg-iris disabled:opacity-50"
        >
          {pending ? "Mendaftarkan…" : "Daftarkan & terbitkan Dompet Gizi"}
        </button>
        <span className="text-xs text-ash">
          Satu Dompet Gizi diterbitkan otomatis untuk Household ini.
        </span>
      </div>
    </form>
  );
}
