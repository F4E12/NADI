import Link from "next/link";
import { listTentSummaries } from "@/lib/data/tents";
import {
  coverTone,
  formatDaysOfCover,
  formatKcal,
  formatWater,
} from "@/lib/format";
import { CreateTentControl, TentRecordControls } from "./tent-crud";
import { deviceRole } from "@/lib/device-role";

const COVER_TONE_CLASS: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
};

export const dynamic = "force-dynamic";

export default async function TentsPage() {
  if ((await deviceRole()) !== "VOLUNTEER") {
    return (
      <div className="nadi-product-page">
        <h1 className="text-2xl font-semibold tracking-tight">Tenda & Kebutuhan</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          Pengelolaan Tenda hanya tersedia di perangkat Volunteer.
        </p>
      </div>
    );
  }

  const tents = await listTentSummaries();

  return (
    <div className="nadi-product-page flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tenda & Kebutuhan</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          Occupancy dan kebutuhan agregat tiap Tenda — digulung dari Household ke
          Tenda lewat tulang punggung Resident → Household → Tenda. Komposisi
          (balita / ibu hamil) menentukan apakah stok tinggi protein boleh masuk.
        </p>
      </div>

      <CreateTentControl />

      <div className="grid gap-4 sm:grid-cols-2">
        {tents.map((t) => {
          const ratio = t.maxCapacity === 0 ? 0 : t.occupancy / t.maxCapacity;
          const qualifies = t.composition.hasToddler || t.composition.hasPregnantResident;
          return (
            <section
              key={t.id}
              id={t.id}
              className="scroll-mt-20 rounded-xl border border-fog bg-white p-5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-semibold">{t.name}</h2>
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${COVER_TONE_CLASS[coverTone(t.daysOfCover)]}`}
                    title="Days of Cover"
                  >
                    {formatDaysOfCover(t.daysOfCover)}
                  </span>
                  <span className="text-sm tabular-nums text-ash">
                    {t.occupancy}/{t.maxCapacity} · {Math.round(ratio * 100)}%
                  </span>
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-ash"
                  style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ash">
                    Gizi / hari
                  </dt>
                  <dd className="tabular-nums">{formatKcal(t.requirement.kcalPerDay)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ash">
                    Air / hari
                  </dt>
                  <dd className="tabular-nums">
                    {formatWater(t.requirement.cleanWaterLitresPerDay)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ash">
                    Household
                  </dt>
                  <dd className="tabular-nums">{t.householdCount}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ash">
                    Komposisi
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {t.composition.hasToddler && <Badge tone="green">balita</Badge>}
                    {t.composition.hasPregnantResident && <Badge tone="pink">ibu hamil</Badge>}
                    {!qualifies && <Badge tone="zinc">tidak ada</Badge>}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-ash">
                  {qualifies
                    ? "Memenuhi syarat untuk stok tinggi protein."
                    : "Stok tinggi protein akan ditolak untuk Tenda ini."}
                </p>
                <Link
                  href={`/allocate?tent=${t.id}`}
                  className="shrink-0 text-xs font-medium text-carbon underline underline-offset-4"
                >
                  Alokasikan →
                </Link>
              </div>

              <TentRecordControls
                id={t.id}
                name={t.name}
                maxCapacity={t.maxCapacity}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "green" | "pink" | "zinc";
  children: React.ReactNode;
}) {
  const tones = {
    green: "bg-green-100 text-green-700",
    pink: "bg-pink-100 text-pink-700",
    zinc: "bg-mist text-graphite",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
