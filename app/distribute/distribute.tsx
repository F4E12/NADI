"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { entitlementLine, formatDateTime } from "@/lib/format";
import type { DistributionContext } from "@/lib/data/distribution";
import { lookupHousehold, recordDistributionBatch } from "./actions";
import { QrScanner } from "./qr-scanner";
import { suggestDistributionPlan } from "@/lib/rules/allocation";

const inputClass =
  "rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-lavender";

type Row = {
  inventoryId: string;
  name: string;
  unit: string;
  available: number;
  kcalPerUnit: number;
  collectedThisPeriod: boolean;
  suggestedQuantity: number;
};

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
      <section className="flex flex-col gap-3 rounded-xl border border-fog bg-white p-5">
        <QrScanner
          onDetect={(text) => {
            setCode(text);
            lookup(text);
          }}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup(code);
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            className={`flex-1 ${inputClass}`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ketik kode fallback, ID Household, atau payload QR"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-lavender px-4 py-2 text-sm font-medium text-white hover:bg-iris disabled:opacity-50"
          >
            Cari
          </button>
        </form>
      </section>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Ditolak: {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}

      {context && (
        <section className="flex flex-col gap-4 rounded-xl border border-fog bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-semibold">
                Keluarga {context.householdName}{" "}
                <Link
                  href={`/households/${context.householdId}`}
                  className="ml-1 text-sm font-normal text-ash underline underline-offset-4"
                >
                  {context.householdId}
                </Link>
              </h2>
              <p className="text-sm text-ash">{context.tentName}</p>
            </div>
            <p className="text-right text-sm text-ash">
              {entitlementLine(context.entitlement)}
            </p>
          </div>

          <p className="text-xs text-ash">
            {context.lastPresence
              ? `Presence terakhir: ${context.lastPresence.tentName} · ${formatDateTime(context.lastPresence.at)} (tingkat Household)`
              : "Belum ada Presence — Household ini belum pernah terpindai."}
          </p>
          <p className="text-xs text-ash">
            Air minimum: {context.householdMemberCount * 2} liter untuk{" "}
            {context.householdMemberCount} anggota keluarga.
          </p>

          <div className="nadi-table-scroll rounded-lg border border-fog bg-white">
            <table className="nadi-stack-table w-full text-sm">
              <thead className="bg-linen text-left text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-3 py-2">Barang</th>
                  <th className="px-3 py-2">Sisa</th>
                  <th className="px-3 py-2">Saran</th>
                  <th className="px-3 py-2 text-right">Ambil</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.inventoryId} className="border-t border-fog">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-ash">
                        {row.kcalPerUnit > 0
                          ? `${row.kcalPerUnit} kcal/unit`
                          : "non-kalori"}
                        {row.collectedThisPeriod ? " · sudah diambil" : ""}
                      </div>
                    </td>
                    <td data-label="Sisa" className="px-3 py-2 tabular-nums text-ash">
                      {row.available} {row.unit}
                    </td>
                    <td data-label="Saran" className="px-3 py-2 tabular-nums text-ash">
                      {row.suggestedQuantity > 0
                        ? `${row.suggestedQuantity} ${row.unit}`
                        : "—"}
                    </td>
                    <td data-label="Ambil" className="px-3 py-2 text-right">
                      <input
                        className="w-full max-w-24 rounded-lg border border-fog bg-white px-2 py-1 text-right text-sm outline-none focus:border-lavender"
                        type="number"
                        min={0}
                        step="any"
                        value={quantities[row.inventoryId] ?? ""}
                        onChange={(e) =>
                          setQuantities((current) => ({
                            ...current,
                            [row.inventoryId]: e.target.value,
                          }))
                        }
                        disabled={row.collectedThisPeriod}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
            <span className="text-graphite">Dicatat oleh</span>
            <input
              className={inputClass}
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Nama Relawan"
            />
          </label>

          <button
            type="button"
            onClick={record}
            disabled={pending || rows.length === 0}
            className="self-start rounded-lg bg-lavender px-5 py-2.5 text-sm font-medium text-white hover:bg-iris disabled:opacity-50"
          >
            {pending ? "Menyimpan…" : "Simpan distribusi"}
          </button>
        </section>
      )}
    </div>
  );
}
