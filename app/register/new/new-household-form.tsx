"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { registerHousehold, type RegisterResult } from "../actions";
import {
  ResidentFields,
  draftToInput,
  emptyResident,
  type ResidentDraft,
} from "../resident-fields";
import type { TentOption } from "@/lib/data/tents";
import type { DeviceRole } from "@/lib/device-role";
import { qrDownload } from "@/lib/qr-download";

type Registration = Extract<RegisterResult, { ok: true }>;

export function NewHouseholdForm({
  tents,
  initialName,
  role,
}: {
  tents: TentOption[];
  initialName: string;
  role: DeviceRole;
}) {
  const [name, setName] = useState(initialName);
  const [tentId, setTentId] = useState(tents[0]?.id ?? "");
  const [residents, setResidents] = useState<ResidentDraft[]>([emptyResident()]);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
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
        setRegistration(result);
      } else {
        setError(result.error);
      }
    });
  }

  if (registration) {
    const download = qrDownload(registration.qrSvg, registration.id);

    return (
      <section
        className="rounded-xl border border-lavender/40 bg-white p-6"
        aria-live="polite"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-iris">
          Registrasi berhasil
        </p>
        <h2 className="mt-2 text-xl font-semibold">Unduh Dompet Gizi Anda</h2>
        <p className="mt-1 max-w-xl text-sm text-graphite">
          Simpan QR ini di ponsel dan tunjukkan saat mengambil ransum untuk
          Household {name}.
        </p>
        <div
          className="mx-auto mt-5 h-52 w-52 [&>svg]:h-full [&>svg]:w-full"
          aria-label={`Kode QR Dompet Gizi ${registration.id}`}
          dangerouslySetInnerHTML={{ __html: registration.qrSvg }}
        />
        <p className="mt-4 text-center text-sm text-ash">
          Kode cadangan: {" "}
          <strong className="font-mono text-lg tracking-widest text-carbon">
            {registration.fallbackCode}
          </strong>
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href={download.href}
            download={download.filename}
            className="rounded-lg bg-lavender px-5 py-2.5 text-sm font-medium text-white hover:bg-iris"
          >
            Unduh QR Dompet Gizi
          </a>
          <Link
            href="/board"
            className="rounded-lg border border-fog px-5 py-2.5 text-sm hover:border-ash"
          >
            Lihat Papan Warga
          </Link>
        </div>
      </section>
    );
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
            showHealthStatus={role === "VOLUNTEER"}
          />
        ))}
        <button
          type="button"
          onClick={addResident}
          className="self-start rounded-lg border border-fog px-3 py-2 text-sm hover:border-ash"
        >
          + Tambah Resident
        </button>
        {role === "RESIDENT" && (
          <p className="text-xs text-ash">
            Status kesehatan dikonfirmasi oleh Relawan. Setelah mendaftar,
            gunakan Lapor kebutuhan jika ada anggota yang sedang sakit.
          </p>
        )}
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
