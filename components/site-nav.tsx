"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DeviceRole } from "@/lib/device-role";

const PRIMARY = [
  { href: "/board", label: "Papan" },
  { href: "/register", label: "Registrasi" },
  { href: "/inventory", label: "Inventaris" },
  { href: "/distribute", label: "Distribusi" },
];

const MORE = [
  { href: "/join", label: "Gabung" },
  { href: "/heat", label: "Heat" },
  { href: "/tents", label: "Tenda" },
  { href: "/allocate", label: "Alokasi" },
  { href: "/presence", label: "Presence" },
  { href: "/complaints", label: "Keluhan" },
  { href: "/allocation-check", label: "Cek Alokasi" },
  { href: "/face-scan", label: "Face Scan" },
  { href: "/devices", label: "Perangkat" },
  { href: "/export", label: "Ekspor Laporan" },
];

function BrandMark() {
  return (
    <span className="nadi-mark" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

export function SiteNav({ role }: { role: DeviceRole }) {
  const pathname = usePathname();
  const isVolunteer = role === "VOLUNTEER";
  const primary = isVolunteer ? PRIMARY : PRIMARY.slice(0, 1);
  const more = isVolunteer
    ? MORE
    : MORE.filter((item) => ["/heat", "/presence", "/complaints"].includes(item.href));

  return (
    <header className="nadi-nav">
      <Link href="/" className="nadi-nav-brand" aria-label="NADI, beranda">
        <BrandMark />
        <strong>NADI</strong>
      </Link>

      <nav className="nadi-nav-links" aria-label="Navigasi utama">
        {primary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-active={pathname.startsWith(item.href) || undefined}
          >
            {item.label}
          </Link>
        ))}
        <details className="nadi-nav-more">
          <summary>Lainnya <span aria-hidden="true">⌄</span></summary>
          <div>
            {more.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}<span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </details>
      </nav>

      <div className="nadi-nav-status" aria-label="Status jaringan lokal">
        <span><i /> Lokal aktif</span>
      </div>

      <Link href={isVolunteer ? "/register" : "/complaints"} className="nadi-nav-action">
        {isVolunteer ? "Catat warga" : "Lapor kebutuhan"}
        <span aria-hidden="true">↗</span>
      </Link>

      <details className="nadi-nav-mobile">
        <summary aria-label="Buka menu"><span /><span /></summary>
        <div>
          {[...primary, ...more].map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </div>
      </details>
    </header>
  );
}
