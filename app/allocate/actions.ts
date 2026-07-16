"use server";

import { revalidatePath } from "next/cache";
import { applyAllocation } from "@/lib/data/allocations";

export type AllocateResult =
  | { ok: true }
  | { ok: false; error: string };

export async function allocateStock(input: {
  tentId: string;
  inventoryId: string;
  quantity: string;
  actor: string;
}): Promise<AllocateResult> {
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
