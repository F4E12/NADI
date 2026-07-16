import { listTentSummaries } from "@/lib/data/tents";
import { listStock } from "@/lib/data/inventory";
import { AllocationCheck } from "./allocation-check";

export const dynamic = "force-dynamic";

export default async function AllocationCheckPage() {
  const [summaries, stock] = await Promise.all([listTentSummaries(), listStock()]);

  const tents = summaries.map((t) => ({
    id: t.id,
    name: t.name,
    composition: t.composition,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cek Alokasi</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Kunci alokasi menyala pada langkah Inventory → Tenda, digerbang oleh
          komposisi Tenda yang digulung dari Household-nya. Stok tinggi protein
          ditolak untuk Tenda tanpa balita dan tanpa ibu hamil — dan menyebutkan
          alasannya. Keputusan ini murni dari rules engine.
        </p>
      </div>
      <AllocationCheck tents={tents} stock={stock} />
    </div>
  );
}
