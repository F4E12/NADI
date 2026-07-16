"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { entitlementLine, formatDateTime } from "@/lib/format";
import type { DistributionContext } from "@/lib/data/distribution";
import { lookupHousehold, recordDistributionAction } from "./actions";
import { QrScanner } from "./qr-scanner";

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";

export function Distribute() {
  const [code, setCode] = useState("");
  const [context, setContext] = useState<DistributionContext | null>(null);
  const [inventoryId, setInventoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [actor, setActor] = useState("Relawan");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function applyContext(next: DistributionContext) {
    setContext(next);
    const firstAvailable =
      next.stock.find((s) => !s.collectedThisPeriod && s.available > 0) ?? next.stock[0];
    setInventoryId(firstAvailable?.inventoryId ?? "");
  }

  function lookup(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await lookupHousehold(value);
      if (result.ok) {
        applyContext(result.context);
      } else {
        setContext(null);
        setError(result.error);
      }
    });
  }

  function record() {
    if (!context) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await recordDistributionAction({
        householdId: context.householdId,
        inventoryId,
        quantity,
        actor,
      });
      if (result.context) applyContext(result.context);
      if (result.ok) {
        setMessage(result.message);
        setQuantity("");
      } else {
        setError(result.error);
      }
    });
  }

  const selected = context?.stock.find((s) => s.inventoryId === inventoryId);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
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
            placeholder="Ketik kode fallback (mis. 290-902), ID Household, atau tempel payload QR"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Cari
          </button>
        </form>
      </section>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Ditolak: {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          {message}
        </p>
      )}

      {context && (
        <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-semibold">
                Keluarga {context.householdName}{" "}
                <Link
                  href={`/households/${context.householdId}`}
                  className="ml-1 text-sm font-normal text-zinc-500 underline underline-offset-4"
                >
                  {context.householdId}
                </Link>
              </h2>
              <p className="text-sm text-zinc-500">{context.tentName}</p>
            </div>
            <p className="text-right text-sm text-zinc-500">
              {entitlementLine(context.entitlement)}
            </p>
          </div>

          <p className="text-xs text-zinc-500">
            {context.lastPresence
              ? `Presence terakhir: ${context.lastPresence.tentName} · ${formatDateTime(context.lastPresence.at)} (tingkat Household)`
              : "Belum ada Presence — Household ini belum pernah terpindai."}
          </p>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Stok diserahkan</span>
              <select
                className={inputClass}
                value={inventoryId}
                onChange={(e) => setInventoryId(e.target.value)}
              >
                {context.stock.map((s) => (
                  <option key={s.inventoryId} value={s.inventoryId}>
                    {s.name} — sisa {s.available} {s.unit}
                    {s.collectedThisPeriod ? " (sudah diambil hari ini)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Jumlah {selected ? `(${selected.unit})` : ""}
              </span>
              <input
                className={`w-28 ${inputClass}`}
                type="number"
                min={0}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="mis. 5"
              />
            </label>
            <button
              type="button"
              onClick={record}
              disabled={pending || !selected}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {pending ? "Mencatat…" : "Catat distribusi"}
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Dicatat oleh</span>
            <input
              className={inputClass}
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="Nama Relawan"
            />
          </label>

          {selected?.collectedThisPeriod && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Household ini sudah mengambil {selected.name} pada periode ini —
              upaya kedua akan ditolak.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
