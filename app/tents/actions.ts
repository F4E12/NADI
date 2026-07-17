"use server";

import { revalidatePath } from "next/cache";
import { deviceRole } from "@/lib/device-role";
import { createTent, deleteTent, renameTent } from "@/lib/data/tents";

export type TentActionState = {
  ok: boolean;
  message: string;
};

async function volunteerOnly(): Promise<TentActionState | null> {
  if ((await deviceRole()) === "VOLUNTEER") return null;
  return { ok: false, message: "Aksi ini khusus perangkat Volunteer" };
}

function refreshTentViews() {
  revalidatePath("/tents");
  revalidatePath("/allocate");
  revalidatePath("/register");
  revalidatePath("/board");
  revalidatePath("/distribute");
  revalidatePath("/heat");
  revalidatePath("/presence");
  revalidatePath("/");
}

export async function createTentAction(
  _previous: TentActionState,
  formData: FormData,
): Promise<TentActionState> {
  const denied = await volunteerOnly();
  if (denied) return denied;

  const result = await createTent({
    name: String(formData.get("name") ?? ""),
    maxCapacity: requiredNumber(formData.get("maxCapacity")),
  });
  if (!result.ok) return { ok: false, message: result.error };

  refreshTentViews();
  return { ok: true, message: "Tenda berhasil ditambahkan" };
}

function requiredNumber(value: FormDataEntryValue | null): number {
  const raw = String(value ?? "").trim();
  return raw ? Number(raw) : Number.NaN;
}

export async function renameTentAction(
  _previous: TentActionState,
  formData: FormData,
): Promise<TentActionState> {
  const denied = await volunteerOnly();
  if (denied) return denied;

  const result = await renameTent({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
  });
  if (!result.ok) return { ok: false, message: result.error };

  refreshTentViews();
  return { ok: true, message: "Nama Tenda berhasil diubah" };
}

export async function deleteTentAction(
  _previous: TentActionState,
  formData: FormData,
): Promise<TentActionState> {
  const denied = await volunteerOnly();
  if (denied) return denied;

  const result = await deleteTent(String(formData.get("id") ?? ""));
  if (!result.ok) return { ok: false, message: result.error };

  refreshTentViews();
  return { ok: true, message: "Tenda berhasil dihapus permanen" };
}
