import Link from "next/link";
import { redirect } from "next/navigation";
import { searchHouseholds } from "@/lib/data/households";
import { deviceRole } from "@/lib/device-role";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if ((await deviceRole()) === "RESIDENT") redirect("/register/new");

  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchHouseholds(query) : [];

  return (
    <div className="nadi-product-page flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Registrasi Household</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          Cari dulu. Sebuah keluarga yang terdaftar dua kali menarik ransum dua
          kali dan mengacaukan Heat Tenda-nya — jadi jawab &ldquo;apakah keluarga
          ini sudah ada?&rdquo; sebelum &ldquo;tambahkan mereka&rdquo;.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Nama keluarga, ID Household, NIK, atau nama Resident…"
          className="flex-1 rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-lavender"
        />
        <button
          type="submit"
          className="rounded-lg bg-lavender px-4 py-2 text-sm font-medium text-white hover:bg-iris"
        >
          Cari
        </button>
      </form>

      {query && (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-ash">
            {results.length === 0
              ? `Tidak ada Household yang cocok dengan “${query}”.`
              : `${results.length} Household cocok dengan “${query}”.`}
          </p>

          {results.length > 0 && (
            <ul className="divide-y divide-fog overflow-hidden rounded-xl border border-fog bg-white">
              {results.map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/households/${h.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-linen"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">Keluarga {h.name}</span>
                      <span className="font-mono text-xs text-ash">
                        {h.id} · kode {h.fallbackCode}
                      </span>
                    </span>
                    <span className="text-right text-sm text-ash">
                      {h.tentName}
                      <br />
                      <span className="text-xs">{h.residentCount} anggota</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="rounded-xl border border-dashed border-fog bg-white p-5">
        <p className="text-sm text-graphite">
          Tidak ada di daftar? Keluarga ini belum terdaftar.
        </p>
        <Link
          href={query ? `/register/new?name=${encodeURIComponent(query)}` : "/register/new"}
          className="mt-3 inline-flex rounded-lg bg-lavender px-4 py-2 text-sm font-medium text-white hover:bg-iris"
        >
          Daftar Household baru
        </Link>
      </div>
    </div>
  );
}
