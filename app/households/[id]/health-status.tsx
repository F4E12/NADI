"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setHealthStatusAction } from "../../complaints/actions";

type HealthStatus = "WELL" | "SICK" | "RECOVERING";

const LABELS: Record<HealthStatus, string> = {
  WELL: "Sehat",
  SICK: "Sakit",
  RECOVERING: "Pemulihan",
};

export function HealthStatusControl({
  residentId,
  current,
}: {
  residentId: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1 text-xs text-ash">
      <span className="sr-only">Status kesehatan</span>
      <select
        value={(current as HealthStatus) in LABELS ? current : "WELL"}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await setHealthStatusAction({
              residentId,
              status: e.target.value as HealthStatus,
            });
            router.refresh();
          })
        }
        className="rounded-md border border-fog bg-white px-2 py-1 text-xs outline-none focus:border-lavender disabled:opacity-50"
      >
        {(Object.keys(LABELS) as HealthStatus[]).map((s) => (
          <option key={s} value={s}>
            {LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
