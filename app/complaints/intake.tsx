"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { SYMPTOM_CATALOG, classifyComplaint } from "@/lib/rules/classification";
import { TONE_BADGE, priorityLabel, priorityTone } from "@/lib/format";
import type { ResidentHit } from "@/lib/data/complaints";
import {
  createComplaintAction,
  extractSymptomsAction,
  searchResidentsAction,
} from "./actions";

export function ComplaintIntake() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResidentHit[]>([]);
  const [selected, setSelected] = useState<ResidentHit | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const suggested = useMemo(() => classifyComplaint(symptoms), [symptoms]);

  function extract() {
    if (!freeText.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await extractSymptomsAction(freeText);
      setSymptoms((current) => [
        ...current,
        ...result.symptoms.filter((s) => !current.includes(s)),
      ]);
      setSource(
        result.symptoms.length > 0
          ? `${result.symptoms.length} gejala diusulkan · sumber: ${result.provider}`
          : `Tidak ada gejala dikenali · sumber: ${result.provider}. Pilih manual di bawah.`,
      );
    });
  }

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
        setFreeText("");
        setSource(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-fog bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ash">
        Ajukan keluhan
      </h2>

      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-fog px-3 py-2 text-sm">
          <span>
            <span className="font-medium">{selected.name}</span>{" "}
            <span className="text-ash">
              · {selected.age} th · Keluarga {selected.householdName} ·{" "}
              {selected.tentName}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-xs text-ash hover:text-carbon"
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
              className="flex-1 rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-lavender"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Resident: nama, NIK, atau ID Household"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-fog px-4 py-2 text-sm hover:border-ash disabled:opacity-50"
            >
              Cari
            </button>
          </form>
          {results.length > 0 && (
            <ul className="max-h-48 divide-y divide-fog overflow-y-auto rounded-lg border border-fog">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(r);
                      setResults([]);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-linen"
                  >
                    <span>
                      {r.name}{" "}
                      <span className="text-ash">· {r.age} th</span>
                    </span>
                    <span className="text-xs text-ash">
                      {r.householdName} · {r.tentName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-ash">
          Teks bebas (opsional) — ketik apa yang Anda dengar
        </label>
        <textarea
          className="w-full rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-lavender"
          rows={2}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder='mis. "dada saya sesak, sudah dua hari"'
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={extract}
            disabled={pending || !freeText.trim()}
            className="rounded-lg border border-fog px-3 py-2 text-sm hover:border-ash disabled:opacity-50"
          >
            Ekstrak gejala
          </button>
          {source && <span className="text-xs text-ash">{source}</span>}
        </div>
      </div>

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
                  : "border-fog text-graphite hover:border-ash"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-ash">Saran Priority (rules):</span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${TONE_BADGE[priorityTone(suggested)]}`}
        >
          {priorityLabel(suggested)}
        </span>
        <span className="text-xs text-ash">
          bukan diagnosis — hanya urutan perhatian; dikonfirmasi manusia
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !selected || symptoms.length === 0}
        className="self-start rounded-lg bg-lavender px-5 py-2.5 text-sm font-medium text-white hover:bg-iris disabled:opacity-50"
      >
        {pending ? "Mengajukan…" : "Ajukan keluhan"}
      </button>
    </section>
  );
}
