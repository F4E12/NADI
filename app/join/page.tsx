import { lanAddresses, serverPort, siteUrl } from "@/lib/network";
import { qrSvg } from "@/lib/qr";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const addresses = lanAddresses();
  const port = serverPort();
  const primary = addresses[0] ?? null;
  const url = primary ? siteUrl(primary.ip, port) : null;
  const qr = url ? await qrSvg(url) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gabung ke Posko</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Pindai kode dari telepon untuk membuka sistem Posko. Tanpa pemasangan,
          tanpa internet — telepon hanya perlu berada di Wi-Fi yang sama dengan
          laptop ini.
        </p>
      </div>

      {url && qr ? (
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div
              className="mx-auto h-52 w-52 [&>svg]:h-full [&>svg]:w-full"
              aria-label={`Kode QR untuk ${url}`}
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <p className="mt-4 text-center font-mono text-sm font-semibold">{url}</p>
            <p className="mt-1 text-center text-xs text-zinc-500">
              via {primary?.iface}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <ol className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Step n={1}>Sambungkan telepon ke Wi-Fi Posko.</Step>
              <Step n={2}>
                Buka aplikasi kamera bawaan dan arahkan ke kode QR di samping.
              </Step>
              <Step n={3}>
                Ketuk tautan yang muncul, atau ketik alamatnya:{" "}
                <span className="font-mono">{url}</span>.
              </Step>
            </ol>

            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Kamera telepon memindai QR lewat aplikasi kamera OS — tidak terkena
              batasan konteks aman. Beberapa telepon bisa terhubung ke laptop yang
              sama dan bekerja pada satu record yang sama.
            </p>

            {addresses.length > 1 && (
              <div className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Alamat lain di laptop ini
                </p>
                <ul className="mt-1 font-mono text-xs text-zinc-500">
                  {addresses.slice(1).map((a) => (
                    <li key={`${a.iface}-${a.ip}`}>
                      {siteUrl(a.ip, port)} — {a.iface}
                      {a.preferred ? "" : " (mungkin tidak terjangkau)"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-400 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-semibold">Laptop belum tersambung ke jaringan lokal.</p>
          <p className="mt-1">
            Sambungkan laptop ke Wi-Fi atau hotspot Posko, lalu muat ulang halaman
            ini. Untuk pengujian di laptop, buka{" "}
            <span className="font-mono">http://localhost:{port}</span>.
          </p>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        Entri lewat QR, bukan captive portal (ADR-0002). Tidak ada DNS spoofing.
      </p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
