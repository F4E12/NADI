import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Papan Warga · Posko Hub",
};

const KITCHEN = [
  { time: "06.30 – 08.00", meal: "Sarapan" },
  { time: "12.00 – 13.30", meal: "Makan siang" },
  { time: "18.00 – 19.30", meal: "Makan malam" },
  { time: "09.00 & 15.00", meal: "Pembagian air bersih" },
];

const INFO = [
  "Setiap keluarga didaftarkan oleh Relawan dan menerima satu Dompet Gizi (kartu QR).",
  "Bawa Dompet Gizi saat mengambil ransum di tenda Anda. Cukup satu kali per periode.",
  "Kartu basah atau robek? Sebutkan kode ketik pada kartu ke Relawan — Anda tetap dilayani.",
  "Merasa tidak enak badan? Sampaikan ke Relawan terdekat; keluhan dicatat dan diprioritaskan.",
];

const FIRST_AID = [
  {
    title: "Luka & perdarahan",
    steps: [
      "Tekan luka dengan kain bersih 10–15 menit tanpa dilepas-lepas.",
      "Angkat bagian yang terluka lebih tinggi dari jantung bila memungkinkan.",
      "Bila darah tembus, tambah kain di atasnya — jangan buka yang bawah.",
    ],
  },
  {
    title: "Diare & dehidrasi",
    steps: [
      "Beri cairan sedikit-sedikit tapi sering.",
      "Oralit rumahan: 1 liter air matang + 6 sendok teh gula + ½ sendok teh garam.",
      "Segera cari Relawan bila lemas berat, mata cekung, atau tidak kencing >6 jam.",
    ],
  },
  {
    title: "Demam",
    steps: [
      "Kompres air hangat, perbanyak minum, istirahat.",
      "Longgarkan pakaian; jangan diselimuti tebal.",
      "Cari bantuan bila demam tinggi disertai kejang atau sesak.",
    ],
  },
  {
    title: "Pingsan",
    steps: [
      "Baringkan, angkat kedua kaki ~30 cm.",
      "Longgarkan pakaian ketat, pastikan udara segar.",
      "Bila tak sadar dalam 1 menit atau napas tak normal, cari Relawan/medis segera.",
    ],
  },
];

const RED_FLAGS = [
  "Sesak napas atau nyeri dada",
  "Perdarahan yang tak berhenti ditekan",
  "Tidak sadarkan diri atau kejang",
  "Diare/muntah terus dengan lemas berat",
];

export default function BoardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Papan Warga</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Informasi Posko, jadwal dapur, dan panduan pertolongan pertama. Halaman
          ini hanya untuk dibaca — tidak perlu akun, tidak perlu mengisi apa pun,
          dan bekerja tanpa internet.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Jadwal Dapur Umum
        </h2>
        <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
          {KITCHEN.map((k) => (
            <li key={k.meal} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium">{k.meal}</span>
              <span className="tabular-nums text-zinc-600 dark:text-zinc-400">{k.time}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Informasi Posko
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          {INFO.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-zinc-400">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Pertolongan Pertama (P3K)
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {FIRST_AID.map((item) => (
            <div key={item.title}>
              <h3 className="font-medium">{item.title}</h3>
              <ul className="mt-1 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                {item.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-zinc-400">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
          Cari Relawan / medis segera bila
        </h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm text-red-800 dark:text-red-200">
          {RED_FLAGS.map((f) => (
            <li key={f} className="flex gap-2">
              <span>•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-zinc-500">
        Panduan umum, bukan pengganti tenaga medis. Bila ragu, hubungi Relawan
        Posko.
      </p>
    </div>
  );
}
