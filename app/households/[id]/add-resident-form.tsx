"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addResidentToHousehold } from "../../register/actions";
import {
  ResidentFields,
  draftToInput,
  emptyResident,
  type ResidentDraft,
} from "../../register/resident-fields";

export function AddResidentForm({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ResidentDraft>(emptyResident());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await addResidentToHousehold(householdId, draftToInput(draft));
      if (result.ok) {
        setDraft(emptyResident());
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:border-zinc-500 dark:border-zinc-700"
      >
        + Tambah Resident ke Household ini
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-xs text-zinc-500">
        Keluarga yang datang bertahap tetap menjadi satu record.
      </p>
      <ResidentFields
        index={0}
        value={draft}
        onChange={setDraft}
        onRemove={() => setOpen(false)}
        removable
      />
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Menyimpan…" : "Simpan Resident"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:border-zinc-500 dark:border-zinc-700"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
