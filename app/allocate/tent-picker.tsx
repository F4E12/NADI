"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { TentOption } from "@/lib/data/tents";

export function TentPicker({
  options,
  selected,
}: {
  options: TentOption[];
  selected: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
      <span className="text-zinc-600 dark:text-zinc-400">Tenda</span>
      <select
        value={selected}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => router.push(`/allocate?tent=${e.target.value}`))
        }
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
