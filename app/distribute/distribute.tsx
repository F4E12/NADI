"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { entitlementLine, formatDateTime } from "@/lib/format";
import type { DistributionContext } from "@/lib/data/distribution";
import { lookupHousehold, recordDistributionBatch } from "./actions";
import { QrScanner } from "./qr-scanner";
import { suggestDistributionPlan } from "@/lib/rules/allocation";

const inputClass = "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";

type Row = { inventoryId: string; name: string; unit: string; available: number; kcalPerUnit: number; collectedThisPeriod: boolean; suggestedQuantity: number };

export function Distribute() {
  const [code, setCode] = useState("");
  const [context, setContext] = useState<DistributionContext | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [actor, setActor] = useState("Relawan");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rows: Row[] = useMemo(() => {
    if (!context) return [];
    const plan = suggestDistributionPlan({
      householdKcalPerDay: context.entitlement.kcalPerDay,
      householdMemberCount: context.householdMemberCount,
      stock: context.stock,
    });
    const suggested = new Map(plan.map((item) => [item.inventoryId, item.suggestedQuantity]));
    return [...context.stock]
      .filter((row) => row.available > 0)
      .sort((a, b) => (a.collectedThisPeriod !== b.collectedThisPeriod ? (a.collectedThisPeriod ? 1 : -1) : b.kcalPerUnit - a.kcalPerUnit || a.name.localeCompare(b.name)))
      .map((row) => ({ ...row, suggestedQuantity: suggested.get(row.inventoryId) ?? 0 }));
  }, [context]);

  function applyContext(next: DistributionContext) {
    setContext(next);
    const plan = suggestDistributionPlan({
      householdKcalPerDay: next.entitlement.kcalPerDay,
      householdMemberCount: next.householdMemberCount,
      stock: next.stock,
    });
    setQuantities(Object.fromEntries(next.stock.map((row) => [row.inventoryId, String(plan.find((item) => item.inventoryId === row.inventoryId)?.suggestedQuantity ?? "")])));
  }

  function lookup(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setError(null); setMessage(null);
    startTransition(async () => {
      const result = await lookupHousehold(value);
      if (result.ok) applyContext(result.context); else { setContext(null); setQuantities({}); setError(result.error); }
    });
  }

  function record() {
    if (!context) return;
    setError(null); setMessage(null);
    startTransition(async () => {
      const result = await recordDistributionBatch({ householdId: context.householdId, actor, items: rows.map((row) => ({ inventoryId: row.inventoryId, quantity: quantities[row.inventoryId] ?? "" })) });
      if (result.context) applyContext(result.context);
      if (result.ok) setMessage(result.message); else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <QrScanner onDetect={(text) => { setCode(text); lookup(text); }} />
        <form onSubmit={(e) => { e.preventDefault(); lookup(code); }} className="flex flex-wrap gap-2">
          <input className={`flex-1 ${inputClass}`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ketik kode fallback, ID Household, atau payload QR" />
          <button type="submit" disabled={pending} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">Cari</button>
        </form>
      </section>

      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">Ditolak: {error}</p>}
      {message && <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">{message}</p>}

      {context && (
        <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-semibold">Keluarga {context.householdName} <Link href={`/households/${context.householdId}`} className="ml-1 text-sm font-normal text-zinc-500 underline underline-offset-4">{context.householdId}</Link></h2>
              <p className="text-sm text-zinc-500">{context.tentName}</p>
            </div>
            <p className="text-right text-sm text-zinc-500">{entitlementLine(context.entitlement)}</p>
          </div>

          <p className="text-xs text-zinc-500">{context.lastPresence ? `Presence terakhir: ${context.lastPresence.tentName} · ${formatDateTime(context.lastPresence.at)} (tingkat Household)` : "Belum ada Presence — Household ini belum pernah terpindai."}</p>
          <p className="text-xs text-zinc-500">
            Air minimum: {context.householdMemberCount * 2} liter untuk {context.householdMemberCount} anggota keluarga.
          </p>

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950">
                <tr><th className="px-3 py-2">Barang</th><th className="px-3 py-2">Sisa</th><th className="px-3 py-2">Saran</th><th className="px-3 py-2 text-right">Ambil</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.inventoryId} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-3 py-2"><div className="font-medium">{row.name}</div><div className="text-xs text-zinc-500">{row.kcalPerUnit > 0 ? `${row.kcalPerUnit} kcal/unit` : "non-kalori"}{row.collectedThisPeriod ? " · sudah diambil" : ""}</div></td>
                    <td className="px-3 py-2 tabular-nums text-zinc-500">{row.available} {row.unit}</td>
                    <td className="px-3 py-2 tabular-nums text-zinc-500">{row.suggestedQuantity > 0 ? `${row.suggestedQuantity} ${row.unit}` : "—"}</td>
                    <td className="px-3 py-2 text-right"><input className="w-24 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-right text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950" type="number" min={0} step="any" value={quantities[row.inventoryId] ?? ""} onChange={(e) => setQuantities((current) => ({ ...current, [row.inventoryId]: e.target.value }))} disabled={row.collectedThisPeriod} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="flex flex-col gap-1 text-sm sm:max-w-xs"><span className="text-zinc-600 dark:text-zinc-400">Dicatat oleh</span><input className={inputClass} value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Nama Relawan" /></label>

          <button type="button" onClick={record} disabled={pending || rows.length === 0} className="self-start rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">{pending ? "Menyimpan…" : "Simpan distribusi"}</button>
        </section>
      )}
    </div>
  );
}