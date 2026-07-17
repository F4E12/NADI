import type { Metadata } from "next";
import { ProductMotion } from "@/components/product-motion";
import { SiteNav } from "@/components/site-nav";
import { deviceRole } from "@/lib/device-role";
import "./globals.css";

export const metadata: Metadata = {
  title: "NADI | Operasi Posko, tetap hidup",
  description: "Record operasional lokal untuk satu Posko. Warga, tenda, gizi, stok, dan keluhan tetap bergerak tanpa internet.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const role = await deviceRole();
  return (
    <html lang="id" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col bg-paper-white text-carbon">
        <SiteNav role={role} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-6">{children}</main>
        <ProductMotion />
        <footer className="border-t border-fog">
          <div className="mx-auto grid max-w-[1200px] gap-4 px-6 py-8 text-caption text-ash sm:grid-cols-[1fr_auto] sm:items-end">
            <div><strong className="mb-1 block text-carbon">NADI</strong><span>Catatan operasional satu Posko, tanpa internet.</span></div>
            <span className="tabular-nums">Lokal · v0.1</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
