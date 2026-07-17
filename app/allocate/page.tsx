import { notFound } from "next/navigation";
import { listTentOptions } from "@/lib/data/tents";
import { getTentAllocationView, listInventoryPool } from "@/lib/data/allocations";
import {
  coverTone,
  formatDaysOfCover,
  formatKcal,
  formatWater,
} from "@/lib/format";
import { TentPicker } from "./tent-picker";
import { AllocateForm } from "./allocate-form";

export const dynamic = "force-dynamic";

const TONE_CLASS: Record<"red" | "amber" | "green", string> = {
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

export default async function AllocatePage({
  searchParams,
}: {
  searchParams: Promise<{ tent?: string }>;
}) {
  const { tent } = await searchParams;
  const options = await listTentOptions();
  if (options.length === 0) {
    return <p className="text-sm text-zinc-500">Belum ada Tenda.</p>;
  }

  const tentId = tent && options.some((o) => o.id === tent) ? tent : options[0].id;
  const [view, pool] = await Promise.all([
    getTentAllocationView(tentId),
    listInventoryPool(),
  ]);
  if (!view) notFound();

  const tone = coverTone(view.daysOfCover);
  const isDry = view.allocations.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alokasi Stok</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Pindahkan stok dari Inventory pusat ke sebuah Tenda. Stok tinggi protein
          hanya boleh masuk ke Tenda dengan balita atau ibu hamil. Tenda yang
          kering adalah kejadian rutin — alokasikan ulang.
        </p>
      </div>

      <TentPicker options={options} selected={tentId} />

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{view.name}</h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${TONE_CLASS[tone]}`}
          >
            Days of Cover: {formatDaysOfCover(view.daysOfCover)}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Metric label="Kebutuhan gizi/hari" value={formatKcal(view.requirement.kcalPerDay)} />
          <Metric label="Gizi teralokasi" value={formatKcal(view.allocatedKcal)} />
          <Metric label="Air/hari" value={formatWater(view.requirement.cleanWaterLitresPerDay)} />
          <Metric label="Occupancy" value={`${view.occupancy}/${view.maxCapacity}`} />
        </dl>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Alokasi saat ini
        </h3>
        {isDry ? (
          <p className="mt-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-200">
            Tenda ini kering — belum ada stok yang dialokasikan. Ini rutin;
            alokasikan di bawah.
          </p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-1 font-medium">Stok</th>
                <th className="py-1 text-right font-medium">Jumlah</th>
                <th className="py-1 text-right font-medium">Energi</th>
              </tr>
            </thead>
            <tbody>
              {view.allocations.map((a) => (
                <tr key={a.inventoryId} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="py-1.5">
                    {a.name}
                    {a.isHighProtein && (
                      <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        protein
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {a.quantity} {a.unit}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-zinc-500">
                    {a.kcal > 0 ? formatKcal(a.kcal) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <AllocateForm
        tentId={tentId}
        tentPopulation={view.occupancy}
        pool={pool}
        composition={view.composition}
        requirementKcalPerDay={view.requirement.kcalPerDay}
        allocatedKcal={view.allocatedKcal}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
