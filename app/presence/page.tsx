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
    <div className="nadi-product-page flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Presence</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
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
              : `${results.length} Household cocok.`}
          </p>

          {results.length > 0 && (
            <ul className="divide-y divide-fog overflow-hidden rounded-xl border border-fog bg-white">
              {results.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
                  <span className="flex flex-col">
                    <Link
                      href={`/households/${h.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      Keluarga {h.name}
                    </Link>
                    <span className="font-mono text-xs text-ash">
                      {h.id} · {h.residentCount} anggota · terdaftar di {h.homeTent}
                    </span>
                  </span>
                  <span className="text-right text-sm">
                    {h.presence ? (
                      <>
                        <span className="font-medium text-green-700">
                          Terlihat di {h.presence.tentName}
                        </span>
                        <br />
                        <span className="text-xs text-ash">
                          {formatDateTime(h.presence.at)} · tingkat Household
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-ash">
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

      <p className="text-xs text-ash">
        Presence diturunkan dari Transaction Log — tanpa langkah pencatatan
        terpisah. Tidak ada Proof of Life perorangan di mana pun sistem ini.
      </p>
    </div>
  );
}
