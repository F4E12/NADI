import Link from "next/link";
import { notFound } from "next/navigation";
import { getHousehold } from "@/lib/data/households";
import { qrSvg } from "@/lib/qr";
import { entitlementLine, formatKcal, formatWater } from "@/lib/format";
import { AddResidentForm } from "./add-resident-form";
import { HealthStatusControl } from "./health-status";

export const dynamic = "force-dynamic";

const HEALTH_LABELS: Record<string, string> = {
  WELL: "Sehat",
  SICK: "Sakit",
  RECOVERING: "Pemulihan",
};

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const household = await getHousehold(id);
  if (!household) notFound();

  const qr = await qrSvg(household.qrPayload);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/register"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Registrasi
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Keluarga {household.name}
        </h1>
        <p className="mt-1 font-mono text-sm text-zinc-500">
          {household.id} · {household.tentName}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Dompet Gizi
          </h2>
          <div
            className="mx-auto mt-3 h-44 w-44 [&>svg]:h-full [&>svg]:w-full"
            aria-label={`Kode QR Dompet Gizi ${household.id}`}
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Kode ketik (fallback)</dt>
              <dd className="font-mono text-lg font-semibold tracking-widest">
                {household.fallbackCode}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Payload</dt>
              <dd className="break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {household.qrPayload}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-zinc-500">
            Kartu basah atau robek tidak mengunci keluarga dari ransumnya — kode
            ketik adalah jalan cadangan.
          </p>
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Kebutuhan Household (Entitlement)
            </h2>
            <div className="mt-3 flex flex-wrap gap-6">
              <Metric
                label="Gizi per hari"
                value={formatKcal(household.entitlement.kcalPerDay)}
              />
              <Metric
                label="Air bersih per hari"
                value={formatWater(household.entitlement.cleanWaterLitresPerDay)}
              />
              <Metric label="Anggota" value={`${household.residents.length} Resident`} />
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Digulung dari tiap Resident berdasarkan umur dan kondisi. Sebuah
              keluarga dengan balita dan ibu hamil tidak sama dengan tiga orang
              dewasa.
            </p>
          </section>

          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="border-b border-zinc-200 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              Residents
            </h2>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {household.residents.map((r) => (
                <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {r.name}{" "}
                      <span className="text-sm font-normal text-zinc-500">
                        · {r.age} th
                      </span>
                      {r.isPregnant && (
                        <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                          hamil
                        </span>
                      )}
                      {r.healthStatus !== "WELL" && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          {HEALTH_LABELS[r.healthStatus] ?? r.healthStatus}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {r.nik ? `NIK ${r.nik}` : "Tanpa NIK"}
                      {r.chronicConditions.length > 0 &&
                        ` · ${r.chronicConditions.join(", ")}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-right text-xs tabular-nums text-zinc-500">
                      {entitlementLine(r.entitlement)}
                    </p>
                    <HealthStatusControl residentId={r.id} current={r.healthStatus} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <AddResidentForm householdId={household.id} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
