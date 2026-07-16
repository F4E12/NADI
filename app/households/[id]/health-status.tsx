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
    <label className="flex items-center gap-1 text-xs text-zinc-500">
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
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
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
