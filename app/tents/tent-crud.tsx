"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createTentAction,
  deleteTentAction,
  renameTentAction,
  type TentActionState,
} from "./actions";

const INITIAL_STATE: TentActionState = { ok: false, message: "" };

function SubmitButton({ children, danger = false }: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={danger
        ? "border border-red-300 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
        : "bg-lavender px-3 py-2 text-sm font-medium text-white disabled:opacity-50"}
    >
      {pending ? "Menyimpan…" : children}
    </button>
  );
}

function ActionMessage({ state }: { state: TentActionState }) {
  if (!state.message) return null;
  return (
    <p role="status" className={`text-xs ${state.ok ? "text-green-700" : "text-red-700"}`}>
      {state.message}
    </p>
  );
}

export function CreateTentControl() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setNotice("");
            setOpen(true);
          }}
          className="bg-lavender px-4 py-2 text-sm font-medium text-white"
        >
          Tambah Tenda
        </button>
        {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
      </div>
    );
  }

  return (
    <CreateTentForm
      onCancel={() => setOpen(false)}
      onSaved={(message) => {
        setNotice(message);
        setOpen(false);
      }}
    />
  );
}

function CreateTentForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, formAction] = useActionState(createTentAction, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) onSaved(state.message);
  }, [onSaved, state]);

  return (
    <form action={formAction} className="border border-fog bg-white p-4">
      <h2 className="text-sm font-semibold">Tambah Tenda</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
        <label className="grid gap-1 text-xs font-medium text-graphite">
          Nama Tenda
          <input name="name" required autoFocus className="px-3 py-2 text-sm" />
        </label>
        <label className="grid gap-1 text-xs font-medium text-graphite">
          Kapasitas
          <input name="maxCapacity" type="number" min="1" step="1" required className="px-3 py-2 text-sm" />
        </label>
        <div className="flex gap-2">
          <SubmitButton>Simpan</SubmitButton>
          <button type="button" onClick={onCancel} className="border border-fog px-3 py-2 text-sm">
            Batal
          </button>
        </div>
      </div>
      <div className="mt-2"><ActionMessage state={state} /></div>
    </form>
  );
}

export function TentRecordControls({ id, name, maxCapacity }: {
  id: string;
  name: string;
  maxCapacity: number;
}) {
  const [mode, setMode] = useState<"idle" | "edit" | "delete">("idle");

  if (mode === "edit") {
    return <RenameTentForm id={id} name={name} maxCapacity={maxCapacity} onClose={() => setMode("idle")} />;
  }
  if (mode === "delete") {
    return <DeleteTentForm id={id} name={name} onClose={() => setMode("idle")} />;
  }

  return (
    <div className="mt-4 flex justify-end gap-2 border-t border-fog pt-3">
      <button type="button" onClick={() => setMode("edit")} className="border border-fog px-3 py-1.5 text-xs font-medium">
        Ubah nama
      </button>
      <button type="button" onClick={() => setMode("delete")} className="border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700">
        Hapus
      </button>
    </div>
  );
}

function RenameTentForm({ id, name, maxCapacity, onClose }: {
  id: string;
  name: string;
  maxCapacity: number;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(renameTentAction, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) onClose();
  }, [onClose, state.ok]);

  return (
    <form action={formAction} className="mt-4 border-t border-fog pt-3">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px_auto] sm:items-end">
        <label className="grid gap-1 text-xs font-medium text-graphite">
          Nama Tenda
          <input name="name" defaultValue={name} required autoFocus className="px-3 py-2 text-sm" />
        </label>
        <label className="grid gap-1 text-xs font-medium text-ash">
          Kapasitas tetap
          <input value={maxCapacity} readOnly aria-readonly="true" className="px-3 py-2 text-sm text-ash" />
        </label>
        <div className="flex gap-2">
          <SubmitButton>Simpan</SubmitButton>
          <button type="button" onClick={onClose} className="border border-fog px-3 py-2 text-sm">Batal</button>
        </div>
      </div>
      <div className="mt-2"><ActionMessage state={state} /></div>
    </form>
  );
}

function DeleteTentForm({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const [state, formAction] = useActionState(deleteTentAction, INITIAL_STATE);

  return (
    <form action={formAction} className="mt-4 border border-red-300 bg-red-50 p-3">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm font-medium text-red-800">Hapus {name} secara permanen?</p>
      <p className="mt-1 text-xs text-red-700">Tenda yang memiliki Household, alokasi, atau riwayat stok tidak dapat dihapus.</p>
      <div className="mt-3 flex items-center gap-2">
        <SubmitButton danger>Hapus permanen</SubmitButton>
        <button type="button" onClick={onClose} className="border border-fog px-3 py-2 text-sm">Batal</button>
      </div>
      <div className="mt-2"><ActionMessage state={state} /></div>
    </form>
  );
}
