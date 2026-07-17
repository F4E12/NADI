export const dynamic = "force-dynamic";

export default function VolunteerOnlyPage() {
  return (
    <div className="nadi-product-page flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Halaman khusus Volunteer
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          Perangkat ini terdaftar sebagai perangkat Resident, jadi halaman
          operasional Posko tidak terbuka dari sini. Papan Warga, Peta Heat,
          Presence, dan pelaporan Keluhan tetap bisa dipakai.
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border border-fog bg-linen px-4 py-3 text-sm text-graphite">
        <p className="font-semibold text-carbon">Volunteer baru?</p>
        <p className="mt-1">
          Bawa telepon ini ke laptop Posko dan minta Coordinator mendaftarkannya
          di halaman Perangkat. Setelah terdaftar, muat ulang halaman — seluruh
          sistem terbuka tanpa pemasangan apa pun.
        </p>
      </div>
    </div>
  );
}
