import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Papan Warga · NADI",
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
    <Reveal className="nadi-product-page mx-auto flex max-w-3xl flex-col gap-8">
      <div data-reveal className="pt-4 text-center">
        <span className="nadi-public-status">
          <i aria-hidden="true" />
          <strong>Akses publik</strong>
          <span aria-hidden="true">·</span>
          <span>Hanya baca, tanpa akun</span>
        </span>
        <h1 className="mt-5 text-heading font-semibold text-carbon">
          Papan Warga
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-body text-graphite">
          Informasi Posko, jadwal dapur, dan panduan pertolongan pertama. Tidak
          perlu mengisi apa pun, dan bekerja tanpa internet.
        </p>
      </div>

      <section
        data-reveal
        className="rounded-2xl border border-fog bg-paper-white p-6"
      >
        <h2 className="text-subheading font-medium text-carbon">
          Jadwal Dapur Umum
        </h2>
        <ul className="mt-4 divide-y divide-fog">
          {KITCHEN.map((k) => (
            <li
              key={k.meal}
              className="flex items-center justify-between py-3 text-[14px]"
            >
              <span className="font-medium text-carbon">{k.meal}</span>
              <span className="rounded-full bg-mist px-3 py-1 tabular-nums text-graphite">
                {k.time}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section
        data-reveal
        className="rounded-2xl border border-fog bg-paper-white p-6"
      >
        <h2 className="text-subheading font-medium text-carbon">
          Informasi Posko
        </h2>
        <ul className="mt-4 flex flex-col gap-3 text-body text-graphite">
          {INFO.map((line) => (
            <li key={line} className="flex gap-3">
              <span className="text-mint">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        data-reveal
        className="rounded-2xl border border-fog bg-paper-white p-6"
      >
        <h2 className="text-subheading font-medium text-carbon">
          Pertolongan Pertama (P3K)
        </h2>
        <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {FIRST_AID.map((item) => (
            <div key={item.title}>
              <h3 className="font-medium text-carbon">{item.title}</h3>
              <ol className="mt-2 flex flex-col gap-2 text-[14px] text-graphite">
                {item.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="tabular-nums text-ash">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section data-reveal className="rounded-2xl bg-ember-wash p-6">
        <h2 className="text-subheading font-medium text-ember-deep">
          Cari Relawan / medis segera bila
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-body text-ember-deep">
          {RED_FLAGS.map((f) => (
            <li key={f} className="flex gap-3">
              <span>!</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <p data-reveal className="text-center text-caption text-ash">
        Panduan umum, bukan pengganti tenaga medis. Bila ragu, hubungi Relawan
        Posko.
      </p>
    </Reveal>
  );
}
