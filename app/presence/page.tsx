import Link from "next/link";
import { searchPresence } from "@/lib/data/presence";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PresencePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchPresence(query) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Presence</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Cari sebuah Household dan lihat kapan terakhir terlihat. Presence adalah
          klaim tingkat <strong>Household</strong> — bukti bahwa{" "}
          <em>seseorang dari Household ini</em> berada di suatu tempat pada suatu
          waktu. Ini bukan pernyataan keselamatan perorangan.
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
              : `${results.length} Household cocok.`}
          </p>

          {results.length > 0 && (
            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {results.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                  <span className="flex flex-col">
                    <Link
                      href={`/households/${h.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      Keluarga {h.name}
                    </Link>
                    <span className="font-mono text-xs text-zinc-500">
                      {h.id} · {h.residentCount} anggota · terdaftar di {h.homeTent}
                    </span>
                  </span>
                  <span className="text-right text-sm">
                    {h.presence ? (
                      <>
                        <span className="font-medium text-green-700 dark:text-green-300">
                          Terlihat di {h.presence.tentName}
                        </span>
                        <br />
                        <span className="text-xs text-zinc-500">
                          {formatDateTime(h.presence.at)} · tingkat Household
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-400">
                        Belum terlihat — belum ada pemindaian Dompet Gizi
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="text-xs text-zinc-500">
        Presence diturunkan dari Transaction Log — tanpa langkah pencatatan
        terpisah. Tidak ada Proof of Life perorangan di mana pun sistem ini.
      </p>
    </div>
  );
}
