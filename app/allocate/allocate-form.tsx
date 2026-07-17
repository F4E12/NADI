"use client";

import { useMemo, useState, useTransition } from "react";
import {
  suggestTentAllocationPlan,
  type TentComposition,
} from "@/lib/rules/allocation";
import type { InventoryPoolItem } from "@/lib/data/allocations";
import { allocateStockBatch } from "./actions";

const inputClass =
  "w-full rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-lavender";

export function AllocateForm({
  tentId,
  tentPopulation,
  pool,
  composition,
  requirementKcalPerDay,
  allocatedKcal,
}: {
  tentId: string;
  tentPopulation: number;
  pool: InventoryPoolItem[];
  composition: TentComposition;
  requirementKcalPerDay: number;
  allocatedKcal: number;
}) {
  const [actor, setActor] = useState("Koordinator");
  const [quantityEdits, setQuantityEdits] = useState<{
    tentId: string;
    values: Record<string, string>;
  }>({ tentId, values: {} });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const plan = useMemo(
    () =>
      suggestTentAllocationPlan({
        requirementKcalPerDay,
        allocatedKcal,
          tentPopulation,
        stock: pool.map((item) => ({
          inventoryId: item.id,
          name: item.name,
          category: item.category,
          isHighProtein: item.isHighProtein,
          unit: item.unit,
          available: item.available,
          kcalPerUnit: item.kcalPerUnit,
        })),
        tent: composition,
      }),
    [allocatedKcal, composition, pool, requirementKcalPerDay, tentPopulation],
  );

  const plannedKcal = useMemo(
    () =>
      plan.reduce((sum, item) => {
        const stock = pool.find((candidate) => candidate.id === item.inventoryId);
        return sum + (stock ? item.quantity * stock.kcalPerUnit : 0);
      }, 0),
    [plan, pool],
  );

  const rows = useMemo(() => {
    const suggested = new Map(plan.map((item) => [item.inventoryId, item.quantity]));
    return [...pool]
      .sort((a, b) => {
        if (a.isHighProtein !== b.isHighProtein) return a.isHighProtein ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((item) => ({
        ...item,
        suggestedQuantity: suggested.get(item.id) ?? 0,
      }));
  }, [pool, plan]);

  const visibleRows = rows.filter((row) => row.available > 0 || row.suggestedQuantity > 0);

  const defaultQuantities = useMemo(
    () =>
      Object.fromEntries(
        visibleRows.map((row) => [
          row.id,
          row.suggestedQuantity > 0 ? String(row.suggestedQuantity) : "",
        ]),
      ),
    [visibleRows],
  );

  function quantityFor(inventoryId: string): string {
    if (
      quantityEdits.tentId === tentId &&
      Object.hasOwn(quantityEdits.values, inventoryId)
    ) {
      return quantityEdits.values[inventoryId];
    }
    return defaultQuantities[inventoryId] ?? "";
  }

  function submit() {
    setError(null);
    setDone(null);
    startTransition(async () => {
      const result = await allocateStockBatch({
        tentId,
        actor,
        items: visibleRows.map((row) => ({
          inventoryId: row.id,
          quantity: quantityFor(row.id),
        })),
      });
      if (result.ok) {
        setDone(result.message);
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
      className="flex flex-col gap-4 rounded-xl border border-fog bg-white p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ash">
        Daftar barang untuk dialokasikan ke Tenda ini
      </h2>

      <p className="text-sm text-graphite">
        Sistem menampilkan daftar barang/makanan sekaligus. Jumlah awal diisi dari
        rule kebutuhan tenda, tetapi tetap bisa diubah manual sebelum disimpan.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Kebutuhan/hari" value={`${requirementKcalPerDay.toLocaleString("id-ID")} kcal`} />
        <Metric label="Sudah teralokasi" value={`${allocatedKcal.toLocaleString("id-ID")} kcal`} />
        <Metric label="Sisa rencana" value={`${plannedKcal.toLocaleString("id-ID")} kcal`} />
      </div>

      <div className="rounded-lg border border-fog bg-linen p-3 text-sm">
        {visibleRows.length === 0 ? (
          <p className="text-ash">Belum ada stok yang tersedia untuk ditampilkan.</p>
        ) : (
          <div className="nadi-table-scroll rounded-lg border border-fog bg-white">
            <table className="nadi-stack-table w-full text-sm">
              <thead className="bg-linen text-left text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-3 py-2 font-medium">Barang</th>
                  <th className="px-3 py-2 font-medium">Sisa</th>
                  <th className="px-3 py-2 font-medium">Saran</th>
                  <th className="px-3 py-2 font-medium text-right">Ambil</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="border-t border-fog">
                    <td className="px-3 py-2">
                      <div className="font-medium text-carbon">
                        {row.name}
                      </div>
                      <div className="text-xs text-ash">
                        {row.category}
                        {row.isHighProtein ? " · protein" : ""}
                      </div>
                    </td>
                    <td data-label="Sisa" className="px-3 py-2 tabular-nums text-ash">
                      {row.available} {row.unit}
                    </td>
                    <td data-label="Saran" className="px-3 py-2 tabular-nums text-ash">
                      {row.suggestedQuantity > 0 ? `${row.suggestedQuantity} ${row.unit}` : "—"}
                    </td>
                    <td data-label="Ambil" className="px-3 py-2 text-right">
                      <input
                        className="w-full max-w-24 rounded-lg border border-fog bg-white px-2 py-1 text-right text-sm outline-none focus:border-lavender"
                        type="number"
                        min={0}
                        step="any"
                        value={quantityFor(row.id)}
                        onChange={(e) =>
                          setQuantityEdits((current) => ({
                            tentId,
                            values: {
                              ...(current.tentId === tentId ? current.values : {}),
                              [row.id]: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
        <span className="text-graphite">Dicatat oleh</span>
        <input
          className={inputClass}
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder="Nama Koordinator"
        />
      </label>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Ditolak: {error}
        </p>
      )}

      {done && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {done}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || visibleRows.length === 0}
        className="self-start rounded-lg bg-lavender px-5 py-2.5 text-sm font-medium text-white hover:bg-iris disabled:opacity-50"
      >
        {pending ? "Menyimpan…" : "Simpan alokasi"}
      </button>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-fog bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-ash">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
