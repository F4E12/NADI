import { listOpenComplaints } from "@/lib/data/complaints";
import { deviceRole } from "@/lib/device-role";
import { ComplaintIntake } from "./intake";
import { ComplaintRow } from "./complaint-row";

export const dynamic = "force-dynamic";

export default async function ComplaintsPage() {
  const [open, role] = await Promise.all([listOpenComplaints(), deviceRole()]);
  const isVolunteer = role === "VOLUNTEER";

  return (
    <div className="nadi-product-page flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Keluhan & Priority</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          {isVolunteer ? (
            <>Seorang Resident melapor sendiri atau <em>melalui</em> Volunteer. </>
          ) : (
            <>Sampaikan keluhan kesehatan langsung dari perangkat ini. </>
          )}
          Rules menyarankan Priority secara deterministik; seorang Volunteer
          mengonfirmasi atau menggantinya sebelum berlaku.{" "}
          <strong>Merah / Kuning / Hijau adalah urutan perhatian — bukan
          diagnosis.</strong> Keluhan yang dikonfirmasi menandai Resident
          sebagai sakit.
        </p>
      </div>

      <ComplaintIntake />

      <section className="overflow-hidden rounded-xl border border-fog bg-white">
        <h2 className="border-b border-fog px-4 py-3 text-sm font-semibold uppercase tracking-wide text-ash">
          Antrean keluhan terbuka ({open.length}) — urut menurut Priority
        </h2>
        {open.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ash">
            Tidak ada keluhan terbuka. Antrean bersih.
          </p>
        ) : (
          <ul className="divide-y divide-fog">
            {open.map((c) => (
              <ComplaintRow key={c.id} complaint={c} canConfirm={isVolunteer} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
