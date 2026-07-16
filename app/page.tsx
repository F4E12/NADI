import Link from "next/link";
import { prisma } from "@/lib/db";
import { listTentSummaries } from "@/lib/data/tents";
import { formatKcal } from "@/lib/format";

export const dynamic = "force-dynamic";

const SURFACES = [
  {
    href: "/register",
    title: "Registrasi",
    body: "Cari dulu, lalu daftarkan sebuah Household beserta Residents, kondisi kronis, dan Tenda-nya.",
  },
  {
    href: "/tents",
    title: "Tenda & Kebutuhan",
    body: "Occupancy tiap Tenda dan kebutuhan agregat yang digulung dari Household ke Tenda.",
  },
  {
    href: "/allocation-check",
    title: "Cek Alokasi",
    body: "Stok tinggi protein ditolak untuk Tenda tanpa balita/ibu hamil — dengan alasannya.",
  },
  {
    href: "/face-scan",
    title: "Face Scan",
    body: "Permukaan pemindaian wajah — disimulasikan, dan dinyatakan begitu di layar.",
  },
];

export default async function Home() {
  const [households, residents, tents, openComplaints] = await Promise.all([
    prisma.household.count(),
    prisma.resident.count(),
    prisma.tent.count(),
    prisma.complaint.count({ where: { resolvedAt: null } }),
  ]);

  const summaries = await listTentSummaries();

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Posko Hub</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Catatan operasional untuk satu Posko, berjalan tanpa internet. Satu
          record bersama yang dipakai banyak Volunteer sekaligus.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Household" value={households} />
          <Stat label="Resident" value={residents} />
          <Stat label="Tenda" value={tents} />
          <Stat label="Keluhan terbuka" value={openComplaints} />
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {SURFACES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{s.title}</h2>
              <span className="text-zinc-400 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Occupancy per Tenda
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {summaries.map((t) => {
            const ratio = t.maxCapacity === 0 ? 0 : t.occupancy / t.maxCapacity;
            return (
              <Link
                key={t.id}
                href={`/tents#${t.id}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="w-20 shrink-0 font-medium">{t.name}</span>
                <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-zinc-500 dark:bg-zinc-400"
                    style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right tabular-nums text-zinc-500">
                  {t.occupancy}/{t.maxCapacity}
                </span>
                <span className="hidden w-28 shrink-0 text-right tabular-nums text-zinc-400 sm:inline">
                  {formatKcal(t.requirement.kcalPerDay)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">
        {value.toLocaleString("id-ID")}
      </dd>
    </div>
  );
}
