"use server";

import { revalidatePath } from "next/cache";
import { deviceRole } from "@/lib/device-role";
import {
  createInventoryItem,
  deleteInventoryItem,
  updateInventoryQuantity,
} from "@/lib/data/inventory";

export type InventoryActionState = {
  ok: boolean;
  message: string;
};

async function volunteerOnly(): Promise<InventoryActionState | null> {
  if ((await deviceRole()) === "VOLUNTEER") return null;
  return { ok: false, message: "Aksi ini khusus perangkat Volunteer" };
}

function refreshInventoryViews() {
  revalidatePath("/inventory");
  revalidatePath("/allocate");
  revalidatePath("/allocation-check");
  revalidatePath("/distribute");
  revalidatePath("/tents");
  revalidatePath("/");
}

export async function createInventoryAction(
  _previous: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const denied = await volunteerOnly();
  if (denied) return denied;

  const result = await createInventoryItem({
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    unit: String(formData.get("unit") ?? ""),
    quantity: requiredNumber(formData.get("quantity")),
    kcalPerUnit: requiredNumber(formData.get("kcalPerUnit")),
    isHighProtein: formData.get("isHighProtein") === "on",
  });
  if (!result.ok) return { ok: false, message: result.error };

  refreshInventoryViews();
  return { ok: true, message: "Inventaris berhasil ditambahkan" };
}

export async function updateInventoryQuantityAction(
  _previous: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const denied = await volunteerOnly();
  if (denied) return denied;

  const result = await updateInventoryQuantity({
    id: String(formData.get("id") ?? ""),
    quantity: requiredNumber(formData.get("quantity")),
  });
  if (!result.ok) return { ok: false, message: result.error };

  refreshInventoryViews();
  return { ok: true, message: "Jumlah pool pusat berhasil diubah" };
}

export async function deleteInventoryAction(
  _previous: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const denied = await volunteerOnly();
  if (denied) return denied;

  const result = await deleteInventoryItem(String(formData.get("id") ?? ""));
  if (!result.ok) return { ok: false, message: result.error };

  refreshInventoryViews();
  return { ok: true, message: "Inventaris berhasil dihapus permanen" };
}

function requiredNumber(value: FormDataEntryValue | null): number {
  const raw = String(value ?? "").trim();
  return raw ? Number(raw) : Number.NaN;
}
