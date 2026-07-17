"use client";

import { useMemo, useState } from "react";
import { allocationDecision, type TentComposition } from "@/lib/rules/allocation";
import type { StockItem } from "@/lib/data/inventory";

type TentOpt = { id: string; name: string; composition: TentComposition };

export function AllocationCheck({
  tents,
  stock,
}: {
  tents: TentOpt[];
  stock: StockItem[];
}) {
  const proteinStock = stock.filter((s) => s.isHighProtein);
  const [stockId, setStockId] = useState(proteinStock[0]?.id ?? stock[0]?.id ?? "");
  const [tentId, setTentId] = useState(tents[0]?.id ?? "");

  const selectedStock = stock.find((s) => s.id === stockId);
  const selectedTent = tents.find((t) => t.id === tentId);

  const decision = useMemo(() => {
    if (!selectedStock || !selectedTent) return null;
    return allocationDecision(
      { name: selectedStock.name, isHighProtein: selectedStock.isHighProtein },
      selectedTent.composition,
    );
  }, [selectedStock, selectedTent]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-graphite">Stok</span>
          <select
            className={selectClass}
            value={stockId}
            onChange={(e) => setStockId(e.target.value)}
          >
            <optgroup label="Gizi tinggi protein">
              {stock
                .filter((s) => s.isHighProtein)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Lainnya">
              {stock
                .filter((s) => !s.isHighProtein)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-graphite">Tenda tujuan</span>
          <select
            className={selectClass}
            value={tentId}
            onChange={(e) => setTentId(e.target.value)}
          >
            {tents.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.composition.hasToddler || t.composition.hasPregnantResident
                  ? " ✓"
                  : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {decision && selectedStock && selectedTent && (
        <Verdict
          decision={decision}
          stockName={selectedStock.name}
          tentName={selectedTent.name}
          composition={selectedTent.composition}
        />
      )}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ash">
          Stok tinggi protein × Tenda
        </h2>
        <div className="nadi-table-scroll mt-3">
          <table className="nadi-data-table nadi-matrix-table text-sm">
            <thead>
              <tr className="text-left text-ash">
                <th className="p-2 font-medium">Stok</th>
                {tents.map((t) => (
                  <th key={t.id} className="p-2 text-center font-medium">
                    {t.name.replace(/^Tenda\s*/, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proteinStock.map((s) => (
                <tr key={s.id}>
                  <td className="p-2 font-medium">{s.name}</td>
                  {tents.map((t) => {
                    const allowed = allocationDecision(
                      { name: s.name, isHighProtein: s.isHighProtein },
                      t.composition,
                    ).allowed;
                    return (
                      <td key={t.id} className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setStockId(s.id);
                            setTentId(t.id);
                          }}
                          title={
                            allowed
                              ? `Boleh: ${s.name} → ${t.name}`
                              : `Ditolak: ${s.name} → ${t.name}`
                          }
                          className={`nadi-matrix-action ${
                            allowed ? "is-allowed" : "is-denied"
                          }`}
                        >
                          {allowed ? "✓" : "✕"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ash">
          Klik sel untuk memuat pasangan itu ke pemeriksa di atas dan membaca
          alasannya.
        </p>
      </section>
    </div>
  );
}

function Verdict({
  decision,
  stockName,
  tentName,
  composition,
}: {
  decision: { allowed: true } | { allowed: false; reason: string };
  stockName: string;
  tentName: string;
  composition: TentComposition;
}) {
  const compositionNote =
    composition.hasToddler || composition.hasPregnantResident
      ? [
          composition.hasToddler ? "ada balita" : null,
          composition.hasPregnantResident ? "ada ibu hamil" : null,
        ]
          .filter(Boolean)
          .join(", ")
      : "tidak ada balita maupun ibu hamil";

  if (decision.allowed) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Boleh dialokasikan
        </p>
        <p className="mt-1 text-lg">
          {stockName} → {tentName}
        </p>
        <p className="mt-1 text-sm text-green-800">
          Tenda ini {compositionNote}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
        Ditolak
      </p>
      <p className="mt-1 text-lg">
        {stockName} → {tentName}
      </p>
      <p className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-red-900">
        {decision.reason}
      </p>
    </div>
  );
}

const selectClass =
  "w-full rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-lavender";
