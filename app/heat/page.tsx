import Link from "next/link";
import { listTentHeat } from "@/lib/data/heat";
import {
  TONE_BADGE,
  formatDaysOfCover,
  priorityLabel,
  priorityTone,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HeatPage() {
  const tents = await listTentHeat();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Peta Heat</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Semua Tenda sekaligus, diurutkan dari yang paling menuntut perhatian.
          Heat selalu berupa daftar <strong>alasan bernama</strong> — tidak pernah
          skor telanjang. Kerentanan kronis, sakit aktif, dan keluhan terbuka
          dihitung terpisah. Dihitung saat dibaca, tidak disimpan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tents.map((t) => (
          <Link
            key={t.id}
            href={`/heat/${t.id}`}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t.name}</h2>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${TONE_BADGE[priorityTone(t.heat.colour)]}`}
              >
                {priorityLabel(t.heat.colour)}
              </span>
            </div>

            {t.heat.reasons.length > 0 ? (
              <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                {t.heat.reasons.map((reason, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-zinc-400">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">
                Tenang — tidak ada alasan perhatian saat ini.
              </p>
            )}

            <p className="mt-auto text-xs text-zinc-400">
              {t.occupancy}/{t.maxCapacity} orang · cover{" "}
              {formatDaysOfCover(t.daysOfCover)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
