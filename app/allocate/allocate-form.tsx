"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { allocationDecision, type TentComposition } from "@/lib/rules/allocation";
import type { InventoryPoolItem } from "@/lib/data/allocations";
import { allocateStock } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";

export function AllocateForm({
  tentId,
  pool,
  composition,
}: {
  tentId: string;
  pool: InventoryPoolItem[];
  composition: TentComposition;
}) {
  const router = useRouter();
  const [inventoryId, setInventoryId] = useState(pool[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [actor, setActor] = useState("Koordinator");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const item = pool.find((p) => p.id === inventoryId);

  const lockWarning = useMemo(() => {
    if (!item) return null;
    const decision = allocationDecision(
      { name: item.name, isHighProtein: item.isHighProtein },
      composition,
    );
    return decision.allowed ? null : decision.reason;
  }, [item, composition]);

  function submit() {
    setError(null);
    setDone(null);
    startTransition(async () => {
      const result = await allocateStock({ tentId, inventoryId, quantity, actor });
      if (result.ok) {
        setDone(`${quantity} ${item?.unit ?? ""} ${item?.name ?? ""} dialokasikan.`);
        setQuantity("");
        router.refresh();
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
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Alokasikan stok ke Tenda ini
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-zinc-600 dark:text-zinc-400">Stok</span>
          <select
            className={inputClass}
            value={inventoryId}
            onChange={(e) => setInventoryId(e.target.value)}
          >
            {pool.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — sisa {p.available} {p.unit}
                {p.isHighProtein ? " (protein)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            Jumlah {item ? `(${item.unit})` : ""}
          </span>
          <input
            className={inputClass}
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="mis. 40"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
        <span className="text-zinc-600 dark:text-zinc-400">Dicatat oleh</span>
        <input
          className={inputClass}
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder="Nama Koordinator"
        />
      </label>

      {lockWarning && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Akan ditolak: {lockWarning}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Ditolak: {error}
        </p>
      )}

      {done && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          {done}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !item}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Mengalokasikan…" : "Alokasikan"}
      </button>
    </form>
  );
}
