"use server";

import { revalidatePath } from "next/cache";
import { registerDevice, revokeDevice } from "@/lib/data/devices";
import { requireLaptop } from "@/lib/device-role";

export async function registerDeviceAction(formData: FormData): Promise<void> {
  if (!(await requireLaptop())) throw new Error("Hanya dari laptop Posko");

  const mac = String(formData.get("mac") ?? "").trim();
  if (!mac) return;
  await registerDevice({ mac, label: String(formData.get("label") ?? "") });
  revalidatePath("/devices");
}

export async function revokeDeviceAction(formData: FormData): Promise<void> {
  if (!(await requireLaptop())) throw new Error("Hanya dari laptop Posko");

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await revokeDevice(id);
  revalidatePath("/devices");
}
