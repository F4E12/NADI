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
        className="self-start rounded-lg border border-fog px-3 py-2 text-sm hover:border-ash"
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
      <p className="text-xs text-ash">
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
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-lavender px-4 py-2 text-sm font-medium text-white hover:bg-iris disabled:opacity-50"
        >
          {pending ? "Menyimpan…" : "Simpan Resident"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-fog px-4 py-2 text-sm hover:border-ash"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
