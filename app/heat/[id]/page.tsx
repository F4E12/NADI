import Link from "next/link";
import { notFound } from "next/navigation";
import { getTentHeatDetail } from "@/lib/data/heat";
import {
  TONE_BADGE,
  formatDaysOfCover,
  priorityLabel,
  priorityTone,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const HEALTH_LABELS: Record<string, string> = {
  WELL: "Sehat",
  SICK: "Sakit",
  RECOVERING: "Pemulihan",
};

export default async function TentHeatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tent = await getTentHeatDetail(id);
  if (!tent) notFound();

  return (
    <div className="nadi-product-page flex flex-col gap-6">
      <div>
        <Link href="/heat" className="text-sm text-ash hover:text-carbon">
          ← Peta Heat
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{tent.name}</h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${TONE_BADGE[priorityTone(tent.heat.colour)]}`}
          >
            {priorityLabel(tent.heat.colour)}
          </span>
        </div>
        <p className="mt-1 text-sm text-ash">
          {tent.occupancy}/{tent.maxCapacity} orang · cover {formatDaysOfCover(tent.daysOfCover)}
        </p>
      </div>

      <section className="rounded-xl border border-fog bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ash">
          Alasan Heat
        </h2>
        {tent.heat.reasons.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {tent.heat.reasons.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-ash">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ash">Tidak ada alasan perhatian.</p>
        )}
      </section>

      {tent.openComplaints.length > 0 && (
        <section className="rounded-xl border border-fog bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ash">
            Keluhan terbuka (belum dikonfirmasi)
          </h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {tent.openComplaints.map((c, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_BADGE[priorityTone(c.suggestedPriority)]}`}
                >
                  {priorityLabel(c.suggestedPriority)}
                </span>
                <span className="font-medium">{c.residentName}</span>
                <span className="text-ash">{c.symptoms.join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-fog bg-white">
        <h2 className="border-b border-fog px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ash">
          Residents ({tent.residents.length})
        </h2>
        <ul className="divide-y divide-fog">
          {tent.residents.map((r) => (
            <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
              <p className="font-medium">
                {r.name}{" "}
                <span className="text-sm font-normal text-ash">· {r.age} th</span>
                {r.healthStatus === "SICK" && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {HEALTH_LABELS[r.healthStatus]}
                  </span>
                )}
                {r.isPregnant && (
                  <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700">
                    hamil
                  </span>
                )}
              </p>
              <p className="text-xs text-ash">
                {r.chronicConditions.length > 0
                  ? r.chronicConditions.join(", ")
                  : "Tanpa kondisi kronis"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
