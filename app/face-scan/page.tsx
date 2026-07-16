import { FaceScan } from "./face-scan";

export const dynamic = "force-dynamic";

export default function FaceScanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Face Scan</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Permukaan pemindaian wajah untuk stasiun laptop. Kamera nyata; pencocokan
          disimulasikan. Dompet Gizi (QR) adalah jalur identifikasi yang
          sebenarnya — permukaan ini berdiri di sampingnya dan tidak dibutuhkan
          oleh alur mana pun.
        </p>
      </div>

      <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          ⚠ SIMULASI — tidak ada pengenalan wajah yang sesungguhnya
        </p>
        <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
          Sistem tidak mengidentifikasi siapa pun. Tidak ada embedding wajah yang
          dihitung atau disimpan. Hasil &ldquo;kecocokan&rdquo; di bawah adalah
          Resident acak dari data seed, semata-mata untuk demonstrasi antarmuka.
        </p>
      </div>

      <FaceScan />
    </div>
  );
}
