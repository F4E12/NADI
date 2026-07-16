"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { SYMPTOM_CATALOG, classifyComplaint } from "@/lib/rules/classification";
import { TONE_BADGE, priorityLabel, priorityTone } from "@/lib/format";
import type { ResidentHit } from "@/lib/data/complaints";
import { createComplaintAction, searchResidentsAction } from "./actions";

export function ComplaintIntake() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResidentHit[]>([]);
  const [selected, setSelected] = useState<ResidentHit | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const suggested = useMemo(() => classifyComplaint(symptoms), [symptoms]);

  function search() {
    if (!query.trim()) return;
    startTransition(async () => {
      setResults(await searchResidentsAction(query));
    });
  }

  function toggle(label: string) {
    setSymptoms((s) =>
      s.includes(label) ? s.filter((x) => x !== label) : [...s, label],
    );
  }

  function submit() {
    if (!selected) {
      setError("Pilih Resident dulu");
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createComplaintAction({
        residentId: selected.id,
        symptoms,
      });
      if (result.ok) {
        setMessage(
          `Keluhan diajukan untuk ${selected.name}. Saran: ${priorityLabel(result.suggested)}. Konfirmasi di antrean di bawah.`,
        );
        setSymptoms([]);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Ajukan keluhan
      </h2>

      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
          <span>
            <span className="font-medium">{selected.name}</span>{" "}
            <span className="text-zinc-500">
              · {selected.age} th · Keluarga {selected.householdName} ·{" "}
              {selected.tentName}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Ganti
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
            className="flex gap-2"
          >
            <input
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Resident: nama, NIK, atau ID Household"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700"
            >
              Cari
            </button>
          </form>
          {results.length > 0 && (
            <ul className="max-h-48 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(r);
                      setResults([]);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <span>
                      {r.name}{" "}
                      <span className="text-zinc-500">· {r.age} th</span>
                    </span>
                    <span className="text-xs text-zinc-500">
                      {r.householdName} · {r.tentName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {SYMPTOM_CATALOG.map((s) => {
          const on = symptoms.includes(s.label);
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => toggle(s.label)}
              className={`rounded-full border px-3 py-1 text-sm ${
                on
                  ? `${TONE_BADGE[priorityTone(s.level)]} border-transparent`
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-zinc-500">Saran Priority (rules):</span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${TONE_BADGE[priorityTone(suggested)]}`}
        >
          {priorityLabel(suggested)}
        </span>
        <span className="text-xs text-zinc-400">
          bukan diagnosis — hanya urutan perhatian; dikonfirmasi manusia
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !selected || symptoms.length === 0}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Mengajukan…" : "Ajukan keluhan"}
      </button>
    </section>
  );
}
