import { listTentHeat } from "@/lib/data/heat";
import { HeatGrid } from "./heat-grid";

export const dynamic = "force-dynamic";

export default async function HeatPage() {
  const tents = await listTentHeat();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Peta Heat</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          Semua Tenda sekaligus, diurutkan dari yang paling menuntut perhatian.
          Setiap sel adalah <strong>alasan bernama</strong> — tidak pernah skor
          telanjang. Kerentanan kronis, sakit aktif, dan keluhan terbuka
          dihitung terpisah. Dihitung saat dibaca, tidak disimpan. Klik nama
          Tenda untuk rincian.
        </p>
      </div>

      <HeatGrid tents={tents} />
    </div>
  );
}
