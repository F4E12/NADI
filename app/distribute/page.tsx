import { Distribute } from "./distribute";

export const dynamic = "force-dynamic";

export default function DistributePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Distribusi</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Pindai Dompet Gizi sebuah Household di stasiun laptop, atau ketik kode
          fallback bila kartu tidak terbaca. Penyerahan menarik dari alokasi
          Tenda — bukan Inventory pusat — dan tercatat di ledger yang hanya bisa
          ditambah. Pengambilan ganda dan alokasi tak cukup ditolak dengan alasan.
        </p>
      </div>
      <Distribute />
    </div>
  );
}
