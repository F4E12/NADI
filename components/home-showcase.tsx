"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatKcal } from "@/lib/format";
import type { DeviceRole } from "@/lib/device-role";

gsap.registerPlugin(ScrollTrigger);

type Metrics = {
  households: number;
  residents: number;
  tents: number;
  openComplaints: number;
};

type Tent = {
  id: string;
  name: string;
  occupancy: number;
  capacity: number;
  kcal: number;
};

const TABS = ["Ringkasan", "Tenda", "Alokasi", "Keluhan"] as const;

const SIGNALS = [
  { label: "Registrasi", icon: "R", tone: "mint", position: "signal-a" },
  { label: "Kebutuhan tenda", icon: "T", tone: "coral", position: "signal-b" },
  { label: "Stok bergerak", icon: "S", tone: "yellow", position: "signal-c" },
  { label: "Keluhan", icon: "K", tone: "lilac", position: "signal-d" },
  { label: "Presence", icon: "P", tone: "blue", position: "signal-e" },
  { label: "Jaringan lokal", icon: "L", tone: "mint", position: "signal-f" },
];

const OPERATIONS = [
  {
    number: "01",
    title: "Daftar",
    body: "Household, Resident, kondisi, dan Tenda masuk ke record yang sama sejak langkah pertama.",
    points: ["Cari sebelum membuat", "Catat kondisi rentan", "Tempatkan ke Tenda"],
    tone: "mint",
  },
  {
    number: "02",
    title: "Pahami",
    body: "Kebutuhan digulung dari orang ke Household lalu ke tingkat Tenda tanpa spreadsheet terpisah.",
    points: ["Occupancy langsung", "Kebutuhan gizi", "Sinyal prioritas"],
    tone: "yellow",
  },
  {
    number: "03",
    title: "Tindak",
    body: "Stok bergerak dengan alasan yang dapat dibaca, diperiksa, dan dilanjutkan shift berikutnya.",
    points: ["Guardrail alokasi", "Ledger append-only", "Keluhan tetap terlihat"],
    tone: "coral",
  },
];

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className={`nadi-mark ${light ? "is-light" : ""}`} aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

export function HomeShowcase({ metrics, tents, role }: { metrics: Metrics; tents: Tent[]; role: DeviceRole }) {
  const isVolunteer = role === "VOLUNTEER";
  const [tab, setTab] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scope = root.current;
    if (!scope) return;

    const context = gsap.context(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(".nadi-intro", { display: "none" });
        return;
      }

      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro
        .fromTo(".nadi-intro-mark", { scale: 0.78, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.65 })
        .to(".nadi-intro-mark", { scale: 1.08, duration: 0.35 }, "+=0.15")
        .to(".nadi-intro", { clipPath: "inset(0 0 100% 0)", duration: 0.82, ease: "power4.inOut" })
        .set(".nadi-intro", { display: "none" })
        .from("[data-hero]", { y: 28, autoAlpha: 0, duration: 0.85, stagger: 0.09 }, "-=0.32")
        .from("[data-signal]", { scale: 0.7, autoAlpha: 0, duration: 0.55, stagger: 0.055 }, "-=0.72")
        .from(".nadi-hero-console", { y: 50, autoAlpha: 0, duration: 1 }, "-=0.66");

      gsap.utils.toArray<HTMLElement>("[data-signal]").forEach((signal, index) => {
        gsap.to(signal, {
          y: index % 2 === 0 ? -9 : 9,
          x: index % 3 === 0 ? 5 : -4,
          duration: 2.8 + index * 0.18,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 44,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power4.out",
          scrollTrigger: { trigger: element, start: "top 86%", once: true },
        });
      });

      gsap.from(".nadi-monolith i", {
        scaleY: 0,
        transformOrigin: "bottom",
        stagger: 0.08,
        duration: 0.9,
        ease: "power4.out",
        scrollTrigger: { trigger: ".nadi-monolith", start: "top 78%", once: true },
      });
    }, scope);

    return () => context.revert();
  }, []);

  function selectTab(next: number) {
    if (next === tab) return;
    setTab(next);
    if (!panel.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    requestAnimationFrame(() => {
      gsap.fromTo(
        panel.current,
        { y: 16, autoAlpha: 0, filter: "blur(5px)" },
        { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.5, ease: "power4.out" },
      );
    });
  }

  return (
    <div ref={root} className="nadi-home">
      <div className="nadi-intro" aria-hidden="true">
        <span className="nadi-intro-mark"><BrandMark light /></span>
      </div>

      <section className="nadi-hero">
        <div className="nadi-signal-field" aria-hidden="true">
          {SIGNALS.map((signal) => (
            <span key={signal.label} data-signal className={`nadi-signal ${signal.position} is-${signal.tone}`}>
              <i>{signal.icon}</i>{signal.label}
            </span>
          ))}
        </div>

        <div className="nadi-hero-copy">
          <p data-hero className="nadi-eyebrow">Operasi Posko, terus berjalan</p>
          <h1 data-hero>Internet mati.<br />Denyut Posko tetap hidup.</h1>
          <p data-hero className="nadi-hero-lede">
            NADI menyatukan warga, tenda, gizi, stok, dan keluhan pada satu record lokal. Banyak perangkat, satu keadaan yang dapat dipercaya.
          </p>
          <div data-hero className="nadi-hero-actions">
            <Link href={isVolunteer ? "/register" : "/board"} className="nadi-button is-dark">
              {isVolunteer ? "Mulai registrasi" : "Lihat papan warga"}<span aria-hidden="true">↗</span>
            </Link>
            <Link href={isVolunteer ? "/board" : "/complaints"} className="nadi-text-link">
              {isVolunteer ? "Buka papan publik" : "Laporkan kebutuhan"}<span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="nadi-hero-console" data-hero>
          <div className="nadi-console-topline">
            <span><BrandMark /> Posko Cempaka</span>
            <span className="nadi-live"><i /> Lokal aktif</span>
          </div>
          <div className="nadi-console-grid">
            <div><span>Resident</span><strong>{metrics.residents}</strong><small>record terdaftar</small></div>
            <div><span>Household</span><strong>{metrics.households}</strong><small>unit keluarga</small></div>
            <div><span>Tenda</span><strong>{metrics.tents}</strong><small>lokasi aktif</small></div>
            <div className="is-alert"><span>Perlu respons</span><strong>{metrics.openComplaints}</strong><small>keluhan terbuka</small></div>
          </div>
        </div>
      </section>

      <section className="nadi-trust-strip" aria-label="Prinsip sistem">
        <p>Satu Posko. Satu record bersama.</p>
        <ul>
          <li>Berjalan offline</li>
          <li>Keputusan dapat ditelusuri</li>
          <li>Manusia tetap memegang kendali</li>
        </ul>
      </section>

      <div className="nadi-monolith" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i />
      </div>

      <section className="nadi-operations">
        <div className="nadi-section-heading" data-reveal>
          <p>Apa yang bergerak</p>
          <h2>Satu alur operasional,<br />bukan kumpulan dashboard.</h2>
          <span>NADI menghubungkan pencatatan dengan tindakan lapangan, lalu meninggalkan jejak yang bisa dilanjutkan.</span>
        </div>

        <div className="nadi-operation-grid">
          {OPERATIONS.map((operation) => (
            <article key={operation.number} className={`nadi-operation is-${operation.tone}`} data-reveal>
              <div className="nadi-operation-art" aria-hidden="true">
                <span>{operation.number}</span>
                <i /><i /><i />
              </div>
              <div className="nadi-operation-copy">
                <span>{operation.number}</span>
                <h3>{operation.title}</h3>
                <p>{operation.body}</p>
                <ul>{operation.points.map((point) => <li key={point}>{point}<b>↗</b></li>)}</ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="nadi-platform" data-reveal>
        <div className="nadi-platform-title">
          <p>Record operasional</p>
          <h2>NADI<br />Platform</h2>
          <span>Empat pandangan atas keadaan Posko yang sama.</span>
        </div>

        <div className="nadi-platform-workspace">
          <div className="nadi-tabs" role="tablist" aria-label="Tampilan dashboard">
            {TABS.map((label, index) => (
              <button key={label} role="tab" aria-selected={tab === index} onClick={() => selectTab(index)}>
                <span>0{index + 1}</span>{label}
              </button>
            ))}
          </div>
          <div ref={panel} className="nadi-dashboard">
            <DashboardChrome />
            <div className="nadi-dashboard-body">
              {tab === 0 && <Overview metrics={metrics} tents={tents} />}
              {tab === 1 && <TentView tents={tents} />}
              {tab === 2 && <AllocationView />}
              {tab === 3 && <ComplaintView count={metrics.openComplaints} />}
            </div>
          </div>
        </div>
      </section>

      <section className="nadi-outcomes">
        <div className="nadi-section-heading is-left" data-reveal>
          <p>Keadaan langsung</p>
          <h2>Tenda yang butuh perhatian terlihat lebih awal.</h2>
        </div>
        <div className="nadi-tent-ledger" data-reveal>
          <div className="nadi-tent-header"><span>Tenda</span><span>Occupancy</span><span>Resident</span><span>Kebutuhan / hari</span></div>
          {tents.map((tent) => {
            const ratio = tent.capacity ? Math.min(100, (tent.occupancy / tent.capacity) * 100) : 0;
            return (
              <Link key={tent.id} href={isVolunteer ? `/tents#${tent.id}` : `/heat/${tent.id}`}>
                <strong>{tent.name}</strong>
                <span className="nadi-occupancy"><i style={{ transform: `scaleX(${ratio / 100})` }} /></span>
                <span className="nadi-tent-count">{tent.occupancy}<small> / {tent.capacity}</small></span>
                <span>{formatKcal(tent.kcal)}<b aria-hidden="true">↗</b></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="nadi-how">
        <div className="nadi-section-heading is-left" data-reveal>
          <p>Cara kerja</p>
          <h2>Dari intake ke tindakan dalam satu jejak.</h2>
        </div>
        <div className="nadi-how-list">
          {[
            ["01", "Hubungkan", "Satu laptop membuka jaringan lokal Posko untuk perangkat relawan."],
            ["02", "Catat", "Cari record lama, lalu tambahkan perubahan tanpa menggandakan orang."],
            ["03", "Pahami", "Kebutuhan orang digulung menjadi sinyal pada tingkat Household dan Tenda."],
            ["04", "Tindak", "Relawan memeriksa alasan, mengambil keputusan, dan meninggalkan jejak."],
          ].map(([number, title, body]) => (
            <article key={number} data-reveal>
              <span>{number}</span><h3>{title}</h3><p>{body}</p><i aria-hidden="true">↗</i>
            </article>
          ))}
        </div>
      </section>

      <section className="nadi-final-cta" data-reveal>
        <div className="nadi-final-copy">
          <BrandMark light />
          <p>Siap dipakai di jaringan lokal.</p>
          <h2>Kerja lapangan tidak perlu menunggu sinyal.</h2>
          <Link href={isVolunteer ? "/register" : "/board"} className="nadi-button is-light">
            {isVolunteer ? "Catat Household pertama" : "Buka papan warga"}<span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="nadi-final-orbit" aria-hidden="true"><span /><span /><strong>NADI</strong></div>
      </section>
    </div>
  );
}

function DashboardChrome() {
  return (
    <div className="nadi-dashboard-chrome">
      <span><BrandMark /> NADI</span>
      <p>Posko Cempaka <i /> Lokal aktif</p>
      <strong>VA</strong>
    </div>
  );
}

function Overview({ metrics, tents }: { metrics: Metrics; tents: Tent[] }) {
  const items = [
    ["Household", metrics.households],
    ["Resident", metrics.residents],
    ["Tenda", metrics.tents],
    ["Keluhan terbuka", metrics.openComplaints],
  ];
  return (
    <div>
      <div className="nadi-dash-heading"><div><span>Ringkasan sekarang</span><h3>Operasi Posko Cempaka</h3></div><p>Database lokal</p></div>
      <div className="nadi-metrics">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className="nadi-dash-grid">
        <div className="nadi-chart-panel"><p>Occupancy per Tenda</p><div className="nadi-chart">{tents.slice(0, 8).map((tent) => <i key={tent.id} style={{ transform: `scaleY(${Math.max(0.14, tent.capacity ? tent.occupancy / tent.capacity : 0.14)})` }} />)}</div></div>
        <div className="nadi-network-panel"><span>Status sistem</span><strong>Lokal aktif</strong><p>Semua perangkat bekerja pada satu record Posko.</p><small>● Siap digunakan</small></div>
      </div>
    </div>
  );
}

function TentView({ tents }: { tents: Tent[] }) {
  return (
    <div>
      <div className="nadi-dash-heading"><div><span>Tenda & kebutuhan</span><h3>Occupancy yang bisa ditindaklanjuti</h3></div></div>
      <div className="nadi-mini-tents">{tents.slice(0, 7).map((tent) => { const ratio = tent.capacity ? Math.min(1, tent.occupancy / tent.capacity) : 0; return <div key={tent.id}><strong>{tent.name}</strong><span><i style={{ transform: `scaleX(${ratio})` }} /></span><b>{tent.occupancy}/{tent.capacity}</b><small>{formatKcal(tent.kcal)}</small></div>; })}</div>
    </div>
  );
}

function AllocationView() {
  return (
    <div>
      <div className="nadi-dash-heading"><div><span>Cek alokasi</span><h3>Alasan terlihat sebelum stok berpindah</h3></div></div>
      <div className="nadi-allocation-demo">
        <div><span>Permintaan</span><strong>Protein tinggi</strong><b>12 paket</b><small>Tujuan: Tenda Cempaka 03</small></div>
        <div><span>Guardrail</span><strong>Perlu pemeriksaan manusia</strong><p>Record tujuan tidak memuat balita atau ibu hamil. Pilih tujuan lain atau catat alasan override.</p><button>Tinjau record sumber ↗</button></div>
      </div>
    </div>
  );
}

function ComplaintView({ count }: { count: number }) {
  const rows = [
    ["10.42", "Air bersih belum tiba di Tenda 02", "Perlu respons"],
    ["09.18", "Lampu lorong mati", "Ditugaskan"],
    ["08.54", "Permintaan popok bayi", "Selesai"],
  ];
  return (
    <div>
      <div className="nadi-dash-heading"><div><span>Tindak lanjut</span><h3>Keluhan tidak hilang di antara shift</h3></div><p>{count} terbuka</p></div>
      <div className="nadi-complaint-table">{rows.map((row, index) => <div key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong><b data-state={index}>{row[2]}</b></div>)}</div>
    </div>
  );
}
