import { listOpenComplaints } from "@/lib/data/complaints";
import { ComplaintIntake } from "./intake";
import { ComplaintRow } from "./complaint-row";

export const dynamic = "force-dynamic";

export default async function ComplaintsPage() {
  const open = await listOpenComplaints();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Keluhan & Priority</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Seorang Resident melapor <em>melalui</em> Volunteer. Rules menyarankan
          Priority secara deterministik; seorang manusia mengonfirmasi atau
          menggantinya sebelum berlaku. <strong>Merah / Kuning / Hijau adalah
          urutan perhatian — bukan diagnosis.</strong> Keluhan yang dikonfirmasi
          menandai Resident sebagai sakit.
        </p>
      </div>

      <ComplaintIntake />

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
          Antrean keluhan terbuka ({open.length}) — urut menurut Priority
        </h2>
        {open.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500">
            Tidak ada keluhan terbuka. Antrean bersih.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {open.map((c) => (
              <ComplaintRow key={c.id} complaint={c} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
