"use server";

import { revalidatePath } from "next/cache";
import { applyAllocation, buildAutoAllocationPlan } from "@/lib/data/allocations";
import { deviceRole } from "@/lib/device-role";

export type AllocateResult =
  | { ok: true }
  | { ok: false; error: string };

export async function allocateStock(input: {
  tentId: string;
  inventoryId: string;
  quantity: string;
  actor: string;
}): Promise<AllocateResult> {
  if ((await deviceRole()) !== "VOLUNTEER") {
    return { ok: false, error: "Alokasi khusus perangkat Volunteer" };
  }
  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, error: "Jumlah harus lebih dari nol" };
  }
  const actor = input.actor.trim() || "Koordinator";

  const outcome = await applyAllocation({
    tentId: input.tentId,
    inventoryId: input.inventoryId,
    quantity,
    actor,
  });
  if (!outcome.ok) return { ok: false, error: outcome.reason };

  revalidatePath("/allocate");
  revalidatePath("/tents");
  revalidatePath("/");
  return { ok: true };
}

export type AutoAllocateResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function autoAllocateStock(input: {
  tentId: string;
  actor: string;
}): Promise<AutoAllocateResult> {
  if ((await deviceRole()) !== "VOLUNTEER") {
    return { ok: false, error: "Alokasi khusus perangkat Volunteer" };
  }
  const actor = input.actor.trim() || "Koordinator";
  const planBundle = await buildAutoAllocationPlan(input.tentId);
  if (!planBundle) return { ok: false, error: "Tenda tidak ditemukan" };
  if (planBundle.plan.length === 0) {
    return { ok: false, error: "Belum ada stok yang bisa dialokasikan otomatis" };
  }

  for (const item of planBundle.plan) {
    const result = await applyAllocation({
      tentId: input.tentId,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      actor,
    });
    if (!result.ok) return { ok: false, error: result.reason };
  }

  revalidatePath("/allocate");
  revalidatePath("/tents");
  revalidatePath("/");
  return {
    ok: true,
    message: `Alokasi otomatis dijalankan untuk ${planBundle.plan.length} item stok.`,
  };
}

export type BatchAllocateResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function allocateStockBatch(input: {
  tentId: string;
  actor: string;
  items: Array<{ inventoryId: string; quantity: string }>;
}): Promise<BatchAllocateResult> {
  if ((await deviceRole()) !== "VOLUNTEER") {
    return { ok: false, error: "Alokasi khusus perangkat Volunteer" };
  }
  const actor = input.actor.trim() || "Koordinator";
  const items = input.items
    .map((item) => ({ inventoryId: item.inventoryId, quantity: Number(item.quantity) }))
    .filter((item) => item.inventoryId && Number.isFinite(item.quantity) && item.quantity > 0);

  if (items.length === 0) {
    return { ok: false, error: "Belum ada barang dengan jumlah yang valid" };
  }

  let processed = 0;
  for (const item of items) {
    const result = await applyAllocation({
      tentId: input.tentId,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      actor,
    });
    if (!result.ok) return { ok: false, error: result.reason };
    processed += 1;
  }

  revalidatePath("/allocate");
  revalidatePath("/tents");
  revalidatePath("/");
  return { ok: true, message: `Alokasi tersimpan untuk ${processed} barang.` };
}
