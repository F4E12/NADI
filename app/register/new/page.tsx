import Link from "next/link";
import { listTentOptions } from "@/lib/data/tents";
import { deviceRole } from "@/lib/device-role";
import { NewHouseholdForm } from "./new-household-form";

export const dynamic = "force-dynamic";

export default async function NewHouseholdPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name = "" } = await searchParams;
  const [tents, role] = await Promise.all([listTentOptions(), deviceRole()]);

  return (
    <div className="nadi-product-page flex flex-col gap-6">
      <div>
        {role === "VOLUNTEER" && (
          <Link href="/register" className="text-sm text-ash hover:text-carbon">
            ← Kembali ke pencarian
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Household baru
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          ID Household dibuat acak dan menjadi kunci. NIK hanya untuk tampilan dan
          pencarian. Setiap Household menerima satu Dompet Gizi saat registrasi.
        </p>
      </div>
      <NewHouseholdForm tents={tents} initialName={name} role={role} />
    </div>
  );
}
