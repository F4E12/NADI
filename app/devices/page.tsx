import { listDevices } from "@/lib/data/devices";
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

  const [devices, neighbours] = await Promise.all([
    listDevices(),
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
              <li key={d.id} className="flex items-center gap-4 px-5 py-3">
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
          <h2 className="text-sm font-semibold">Perangkat di Wi-Fi saat ini</h2>
          <p className="mt-0.5 text-xs text-ash">
            Minta Volunteer membuka situs ini dari teleponnya agar muncul di
            daftar, lalu daftarkan barisnya.
          </p>
        </div>
        {neighbours.length === 0 ? (
          <p className="px-5 py-4 text-sm text-ash">
            Belum ada perangkat lain yang terlihat di jaringan.
          </p>
        ) : (
          <ul className="divide-y divide-fog">
            {neighbours.map((n) => (
              <li key={n.mac} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <p className="font-mono text-sm">{n.mac}</p>
                  <p className="text-xs text-ash">{n.ip}</p>
                </div>
                {registered.has(n.mac) ? (
                  <span className="rounded-full bg-linen px-3 py-1 text-xs font-medium text-graphite">
                    Terdaftar
                  </span>
                ) : (
                  <form action={registerDeviceAction} className="flex items-center gap-2">
                    <input type="hidden" name="mac" value={n.mac} />
                    <input
                      name="label"
                      placeholder="Label (mis. HP Budi)"
                      className="rounded-lg border border-fog bg-white px-3 py-1.5 text-sm outline-none focus:border-lavender"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-lavender px-3 py-1.5 text-sm font-medium text-white hover:bg-iris"
                    >
                      Daftarkan
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
