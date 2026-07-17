"use client";

import { useMemo, useState } from "react";
import {
  formatDaysOfCover,
  priorityLabel,
  priorityTone,
  TONE_BADGE,
} from "@/lib/format";
import { buildSummaryText } from "@/lib/report/summary-text";
import type { ExportReport, RosterHousehold } from "@/lib/data/report";
import type { ShortageItem } from "@/lib/report/report";

const num = new Intl.NumberFormat("id-ID");

const SHORTAGE_LABELS: Record<ShortageItem["status"], string> = {
  HABIS: "Habis",
  MENIPIS: "Menipis",
};

const SHORTAGE_TONE: Record<ShortageItem["status"], "red" | "amber" | "green"> = {
  HABIS: "red",
  MENIPIS: "amber",
};

export function ExportDocument({
  report,
  generatedAt,
}: {
  report: ExportReport;
  generatedAt: string;
}) {
  const [poskoName, setPoskoName] = useState("");
  const [location, setLocation] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [copied, setCopied] = useState(false);

  const summaryText = useMemo(
    () =>
      buildSummaryText({
        header: { poskoName, location, preparedBy },
        generatedAtLabel: generatedAt,
        coverage: report.coverage,
        tents: report.tents.map((t) => ({ name: t.name, headcount: t.headcount })),
        shortages: report.shortages,
      }),
    [poskoName, location, preparedBy, generatedAt, report],
  );

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const coverBadge = TONE_BADGE[priorityTone(report.coverage.colour)];

  return (
    <div className="nadi-product-page nadi-export flex flex-col gap-6">
      <div className="nadi-export-controls flex flex-col gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ekspor Laporan
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-graphite">
            Satu dokumen ringan untuk diserahkan ke logistik dan pencatatan
            resmi: daftar pengungsi terdaftar plus stok yang habis atau menipis.
            Isi kop di bawah, lalu <strong>Cetak / PDF</strong> atau{" "}
            <strong>Salin ringkasan</strong> untuk WhatsApp.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-ash">
              Nama Posko
            </span>
            <input
              value={poskoName}
              onChange={(e) => setPoskoName(e.target.value)}
              placeholder="mis. Posko Cimahi 2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-ash">
              Lokasi
            </span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="mis. Lapangan Merdeka"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-ash">
              Disiapkan oleh
            </span>
            <input
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="mis. Koordinator Posko"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-lavender px-4 py-2 text-sm font-medium text-white hover:bg-iris"
          >
            Cetak / PDF
          </button>
          <button
            type="button"
            onClick={copySummary}
            className="rounded-lg border border-fog px-4 py-2 text-sm font-medium hover:border-carbon"
          >
            {copied ? "Tersalin ✓" : "Salin ringkasan"}
          </button>
        </div>
      </div>

      <article className="nadi-export-sheet flex flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-fog pb-5">
          <div className="flex items-baseline justify-between gap-4">
            <strong className="text-lg tracking-tight">NADI</strong>
            <span className="text-xs text-ash">{generatedAt}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Laporan Pengungsi &amp; Kebutuhan Stok
            </h2>
            <p className="mt-1 text-sm text-graphite">
              {poskoName.trim() || "Posko —"}
              {location.trim() ? ` · ${location.trim()}` : ""}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ash">
                Total pengungsi
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {num.format(report.population)} jiwa
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ash">
                Jumlah tenda
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {num.format(report.tents.length)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ash">
                Cakupan pangan
              </dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${coverBadge}`}
                >
                  {formatDaysOfCover(report.coverage.daysOfCover)} ·{" "}
                  {priorityLabel(report.coverage.colour)}
                </span>
              </dd>
            </div>
          </dl>
        </header>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ash">
            Kebutuhan Stok
          </h3>
          {report.shortages.length === 0 ? (
            <p className="rounded-lg border border-fog bg-linen px-3 py-2 text-sm text-graphite">
              Stok memadai — tidak ada kekurangan kritis saat ini.
            </p>
          ) : (
            <div className="nadi-table-scroll">
              <table className="nadi-data-table text-sm">
                <thead>
                  <tr className="text-left text-ash">
                    <th className="px-4 py-2 font-medium">Stok</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 text-right font-medium">Pool pusat</th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                    <th className="px-4 py-2 text-right font-medium">Sisa cakupan</th>
                  </tr>
                </thead>
                <tbody>
                  {report.shortages.map((item) => (
                    <tr key={item.name}>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE_BADGE[SHORTAGE_TONE[item.status]]}`}
                        >
                          {SHORTAGE_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {num.format(item.central)} {item.unit}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {num.format(item.total)} {item.unit}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-ash">
                        {item.daysOfCover !== null
                          ? formatDaysOfCover(item.daysOfCover)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ash">
            Daftar Pengungsi Terdaftar
          </h3>
          {report.tents.length === 0 ? (
            <p className="rounded-lg border border-fog bg-linen px-3 py-2 text-sm text-graphite">
              Belum ada tenda atau pengungsi terdaftar.
            </p>
          ) : (
            report.tents.map((tent) => (
              <div key={tent.name} className="nadi-export-tent flex flex-col gap-2">
                <h4 className="flex items-baseline justify-between border-b border-fog pb-1 text-sm font-semibold">
                  <span>{tent.name}</span>
                  <span className="tabular-nums text-ash">
                    {num.format(tent.headcount)} jiwa
                  </span>
                </h4>
                <div className="nadi-table-scroll">
                  <table className="nadi-data-table text-sm">
                    <thead>
                      <tr className="text-left text-ash">
                        <th className="px-4 py-2 font-medium">Nama</th>
                        <th className="px-4 py-2 text-right font-medium">Umur</th>
                        <th className="px-4 py-2 font-medium">NIK</th>
                        <th className="px-4 py-2 font-medium">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tent.households.map((household) => (
                        <ResidentRows key={household.id} household={household} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </section>

        <div className="nadi-export-signatures mt-4 flex flex-col gap-10 border-t border-fog pt-6 text-sm sm:flex-row sm:justify-between">
          <div>
            <p className="text-ash">Disiapkan oleh</p>
            <div className="mt-10 w-56 border-t border-carbon pt-1">
              {preparedBy.trim() || " "}
            </div>
          </div>
          <div>
            <p className="text-ash">Diketahui</p>
            <div className="mt-10 w-56 border-t border-carbon pt-1">&nbsp;</div>
          </div>
        </div>
      </article>
    </div>
  );
}

function ResidentRows({ household }: { household: RosterHousehold }) {
  return (
    <>
      <tr className="nadi-export-household">
        <td colSpan={4} className="px-4 py-1.5 text-xs font-medium text-ash">
          KK {household.name} · {household.id}
        </td>
      </tr>
      {household.residents.map((resident, index) => (
        <tr key={`${household.id}-${index}`}>
          <td className="px-4 py-2">{resident.name}</td>
          <td className="px-4 py-2 text-right tabular-nums">{resident.age}</td>
          <td className="px-4 py-2 tabular-nums">{resident.nik ?? "—"}</td>
          <td className="px-4 py-2 text-graphite">
            {resident.flags.length > 0 ? resident.flags.join(", ") : "—"}
          </td>
        </tr>
      ))}
    </>
  );
}
