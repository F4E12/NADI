import Link from "next/link";
import { searchHouseholds } from "@/lib/data/households";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchHouseholds(query) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Registrasi Household</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
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
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Cari
        </button>
      </form>

      {query && (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">
            {results.length === 0
              ? `Tidak ada Household yang cocok dengan “${query}”.`
              : `${results.length} Household cocok dengan “${query}”.`}
          </p>

          {results.length > 0 && (
            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {results.map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/households/${h.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">Keluarga {h.name}</span>
                      <span className="font-mono text-xs text-zinc-500">
                        {h.id} · kode {h.fallbackCode}
                      </span>
                    </span>
                    <span className="text-right text-sm text-zinc-500">
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

      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Tidak ada di daftar? Keluarga ini belum terdaftar.
        </p>
        <Link
          href={query ? `/register/new?name=${encodeURIComponent(query)}` : "/register/new"}
          className="mt-3 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Daftar Household baru
        </Link>
      </div>
    </div>
  );
}
