import { listDevices, listRecentDeviceSightings } from "@/lib/data/devices";
import { arpNeighbourhood, requireLaptop } from "@/lib/device-role";
import { formatDateTime } from "@/lib/format";
import { registerDeviceAction, revokeDeviceAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  if (!(await requireLaptop())) {
    return (
      <div className="nadi-product-page">
        <h1 className="text-2xl font-semibold tracking-tight">Perangkat</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          Pendaftaran perangkat hanya bisa dilakukan dari laptop Posko itu
          sendiri — bukan dari telepon, sekalipun milik Volunteer.
        </p>
      </div>
    );
  }

  const [devices, sightings, neighbours] = await Promise.all([
    listDevices(),
    listRecentDeviceSightings(),
    arpNeighbourhood(),
  ]);
  const registered = new Set(devices.map((d) => d.mac));

  return (
    <div className="nadi-product-page flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perangkat</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          Perangkat Volunteer dikenali dari alamat MAC-nya di jaringan Posko —
          tanpa akun, tanpa kata sandi. Perangkat yang tidak terdaftar otomatis
          menjadi perangkat Resident: hanya Papan Warga, Peta Heat, Presence,
          dan pelaporan Keluhan yang terbuka.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-fog bg-white">
        <h2 className="border-b border-fog px-5 py-3 text-sm font-semibold">
          Perangkat Volunteer terdaftar
        </h2>
        {devices.length === 0 ? (
          <p className="px-5 py-4 text-sm text-ash">
            Belum ada perangkat terdaftar. Laptop ini sendiri selalu Volunteer.
          </p>
        ) : (
          <ul className="divide-y divide-fog">
            {devices.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{d.label ?? "Tanpa label"}</p>
                  <p className="font-mono text-xs text-ash">{d.mac}</p>
                </div>
                <span className="text-xs text-ash">
                  {formatDateTime(d.registeredAt)}
                </span>
                <form action={revokeDeviceAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-fog px-3 py-1.5 text-sm hover:border-ash"
                  >
                    Cabut
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-fog bg-white">
        <div className="border-b border-fog px-5 py-3">
          <h2 className="text-sm font-semibold">Resident Device yang baru membuka NADI</h2>
          <p className="mt-0.5 text-xs text-ash">
            Minta Volunteer membuka NADI dari teleponnya, lalu muat ulang halaman
            ini. Kunjungan dalam 10 menit terakhir muncul paling baru di atas.
          </p>
        </div>
        {sightings.length === 0 ? (
          <p className="px-5 py-4 text-sm text-ash">
            Belum ada Resident Device yang membuka NADI dalam 10 menit terakhir.
          </p>
        ) : (
          <ul className="divide-y divide-fog">
            {sightings.map((sighting) => (
              <li key={sighting.ip} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                <div className="flex-1">
                  <p className="font-mono text-sm">{sighting.mac ?? "MAC belum terlihat"}</p>
                  <p className="text-xs text-ash">
                    {sighting.ip} · {formatDateTime(sighting.lastSeenAt)}
                  </p>
                </div>
                {sighting.mac && registered.has(sighting.mac) ? (
                  <span className="rounded-full bg-linen px-3 py-1 text-xs font-medium text-graphite">
                    Terdaftar
                  </span>
                ) : sighting.mac ? (
                  <form action={registerDeviceAction} className="flex w-full items-center gap-2 sm:w-auto">
                    <input type="hidden" name="mac" value={sighting.mac} />
                    <input
                      name="label"
                      placeholder="Label (mis. HP Budi)"
                      className="min-w-0 flex-1 rounded-lg border border-fog bg-white px-3 py-1.5 text-sm outline-none focus:border-lavender sm:w-52 sm:flex-none"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-lavender px-3 py-1.5 text-sm font-medium text-white hover:bg-iris"
                    >
                      Daftarkan
                    </button>
                  </form>
                ) : (
                  <span className="max-w-xs text-xs text-ash">
                    Wi-Fi tidak membuka alamat perangkat. Gunakan pendaftaran manual di bawah.
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-fog bg-white">
        <div className="border-b border-fog px-5 py-3">
          <h2 className="text-sm font-semibold">Daftarkan lewat alamat MAC</h2>
          <p className="mt-0.5 text-xs text-ash">
            Fallback untuk Wi-Fi yang menyembunyikan perangkat. Buka detail jaringan
            Wi-Fi di telepon, lalu salin “Alamat Wi-Fi”, “Private Wi-Fi Address”, atau “MAC”.
          </p>
        </div>
        <form action={registerDeviceAction} className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-1 text-xs font-medium text-graphite">
            Alamat MAC
            <input
              required
              name="mac"
              placeholder="2a:c1:36:89:c0:44"
              pattern="[0-9A-Fa-f]{1,2}([:-][0-9A-Fa-f]{1,2}){5}"
              className="rounded-lg border border-fog bg-white px-3 py-2 font-mono text-sm outline-none focus:border-lavender"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-graphite">
            Label
            <input
              name="label"
              placeholder="mis. HP Budi"
              className="rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-lavender"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-lavender px-4 py-2 text-sm font-medium text-white hover:bg-iris"
          >
            Daftarkan
          </button>
        </form>
      </section>

      <details className="border border-fog bg-white">
        <summary className="cursor-pointer px-5 py-3 text-sm font-semibold">
          Cache jaringan mentah ({neighbours.length})
        </summary>
        <p className="border-t border-fog px-5 py-3 text-xs text-ash">
          Daftar diagnostik dari laptop; ini dapat berisi banyak perangkat yang tidak pernah membuka NADI.
        </p>
        <ul className="max-h-80 overflow-y-auto border-t border-fog px-5 py-3 font-mono text-xs text-ash">
          {neighbours.map((neighbour) => (
            <li key={`${neighbour.ip}-${neighbour.mac}`} className="py-1">
              {neighbour.ip} · {neighbour.mac}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
