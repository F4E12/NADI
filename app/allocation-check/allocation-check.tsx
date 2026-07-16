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
          <span className="text-zinc-600 dark:text-zinc-400">Stok</span>
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
          <span className="text-zinc-600 dark:text-zinc-400">Tenda tujuan</span>
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
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Stok tinggi protein × Tenda
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
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
                <tr key={s.id} className="border-t border-zinc-200 dark:border-zinc-800">
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
                          className={
                            allowed
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
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
        <p className="mt-2 text-xs text-zinc-500">
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
      <div className="rounded-xl border border-green-300 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
          Boleh dialokasikan
        </p>
        <p className="mt-1 text-lg">
          {stockName} → {tentName}
        </p>
        <p className="mt-1 text-sm text-green-800 dark:text-green-200">
          Tenda ini {compositionNote}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
        Ditolak
      </p>
      <p className="mt-1 text-lg">
        {stockName} → {tentName}
      </p>
      <p className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-red-900 dark:bg-black/30 dark:text-red-200">
        {decision.reason}
      </p>
    </div>
  );
}

const selectClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";
