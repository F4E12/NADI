import Link from "next/link";
import { listTentOptions } from "@/lib/data/tents";
import { NewHouseholdForm } from "./new-household-form";

export const dynamic = "force-dynamic";

export default async function NewHouseholdPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name = "" } = await searchParams;
  const tents = await listTentOptions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/register" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← Kembali ke pencarian
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Household baru
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          ID Household dibuat acak dan menjadi kunci. NIK hanya untuk tampilan dan
          pencarian. Setiap Household menerima satu Dompet Gizi saat registrasi.
        </p>
      </div>
      <NewHouseholdForm tents={tents} initialName={name} />
    </div>
  );
}
