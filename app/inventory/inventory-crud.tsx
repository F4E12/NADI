"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createInventoryAction,
  deleteInventoryAction,
  updateInventoryQuantityAction,
  type InventoryActionState,
} from "./actions";

const INITIAL_STATE: InventoryActionState = { ok: false, message: "" };

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

function ActionMessage({ state }: { state: InventoryActionState }) {
  if (!state.message) return null;
  return (
    <p role="status" className={`text-xs ${state.ok ? "text-green-700" : "text-red-700"}`}>
      {state.message}
    </p>
  );
}

export function CreateInventoryControl({
  categories,
  units,
}: {
  categories: string[];
  units: string[];
}) {
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
          Tambah Inventaris
        </button>
        {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
      </div>
    );
  }

  return (
    <CreateInventoryForm
      categories={categories}
      units={units}
      onCancel={() => setOpen(false)}
      onSaved={(message) => {
        setNotice(message);
        setOpen(false);
      }}
    />
  );
}

function CreateInventoryForm({
  categories,
  units,
  onCancel,
  onSaved,
}: {
  categories: string[];
  units: string[];
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, formAction] = useActionState(createInventoryAction, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) onSaved(state.message);
  }, [onSaved, state]);

  return (
    <form action={formAction} className="border border-fog bg-white p-4">
      <h2 className="text-sm font-semibold">Tambah Inventaris</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1 text-xs font-medium text-graphite">
          Nama inventaris
          <input name="name" required autoFocus className="px-3 py-2 text-sm" />
        </label>
        <label className="grid gap-1 text-xs font-medium text-graphite">
          Kategori
          <input name="category" list="inventory-category-options" required className="px-3 py-2 text-sm" />
        </label>
        <label className="grid gap-1 text-xs font-medium text-graphite">
          Satuan
          <input name="unit" list="inventory-unit-options" required className="px-3 py-2 text-sm" />
        </label>
        <label className="grid gap-1 text-xs font-medium text-graphite">
          Jumlah pool pusat
          <input name="quantity" type="number" min="0" step="any" required className="px-3 py-2 text-sm" />
        </label>
        <label className="grid gap-1 text-xs font-medium text-graphite">
          Kkal per satuan
          <input name="kcalPerUnit" type="number" min="0" step="any" required className="px-3 py-2 text-sm" />
        </label>
        <label className="flex min-h-11 items-center gap-2 self-end text-sm font-medium text-graphite">
          <input name="isHighProtein" type="checkbox" />
          Stok tinggi protein
        </label>
      </div>
      <datalist id="inventory-category-options">
        {categories.map((category) => <option key={category} value={category} />)}
      </datalist>
      <datalist id="inventory-unit-options">
        {units.map((unit) => <option key={unit} value={unit} />)}
      </datalist>
      <div className="mt-4 flex items-center gap-2">
        <SubmitButton>Simpan</SubmitButton>
        <button type="button" onClick={onCancel} className="border border-fog px-3 py-2 text-sm">Batal</button>
      </div>
      <div className="mt-2"><ActionMessage state={state} /></div>
    </form>
  );
}

export function InventoryRecordControls({
  id,
  name,
  quantity,
  unit,
}: {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}) {
  const [mode, setMode] = useState<"idle" | "edit" | "delete">("idle");

  if (mode === "edit") {
    return <QuantityForm id={id} quantity={quantity} unit={unit} onClose={() => setMode("idle")} />;
  }
  if (mode === "delete") {
    return <DeleteInventoryForm id={id} name={name} onClose={() => setMode("idle")} />;
  }

  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={() => setMode("edit")} className="border border-fog px-2 py-1 text-xs font-medium">
        Ubah jumlah
      </button>
      <button type="button" onClick={() => setMode("delete")} className="border border-red-300 px-2 py-1 text-xs font-medium text-red-700">
        Hapus
      </button>
    </div>
  );
}

function QuantityForm({ id, quantity, unit, onClose }: {
  id: string;
  quantity: number;
  unit: string;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(updateInventoryQuantityAction, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) onClose();
  }, [onClose, state.ok]);

  return (
    <form action={formAction} className="grid min-w-56 gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="grid gap-1 text-left text-xs font-medium text-graphite">
        Jumlah pool pusat ({unit})
        <input name="quantity" type="number" min="0" step="any" defaultValue={quantity} required autoFocus className="px-2 py-1 text-sm" />
      </label>
      <div className="flex justify-end gap-2">
        <SubmitButton>Simpan</SubmitButton>
        <button type="button" onClick={onClose} className="border border-fog px-2 py-1 text-xs">Batal</button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

function DeleteInventoryForm({ id, name, onClose }: {
  id: string;
  name: string;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(deleteInventoryAction, INITIAL_STATE);

  return (
    <form action={formAction} className="min-w-64 border border-red-300 bg-red-50 p-3 text-left">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm font-medium text-red-800">Hapus {name} secara permanen?</p>
      <p className="mt-1 text-xs text-red-700">Inventaris dengan alokasi atau riwayat stok tidak dapat dihapus.</p>
      <div className="mt-3 flex justify-end gap-2">
        <SubmitButton danger>Hapus permanen</SubmitButton>
        <button type="button" onClick={onClose} className="border border-fog px-2 py-1 text-xs">Batal</button>
      </div>
      <div className="mt-2"><ActionMessage state={state} /></div>
    </form>
  );
}
