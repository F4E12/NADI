"use server";

import { revalidatePath } from "next/cache";
import {
  getDistributionContext,
  recordDistribution,
  resolveHousehold,
  type DistributionContext,
} from "@/lib/data/distribution";
import { deviceRole } from "@/lib/device-role";

export type LookupResult =
  | { ok: true; context: DistributionContext }
  | { ok: false; error: string };

export async function lookupHousehold(code: string): Promise<LookupResult> {
  const id = await resolveHousehold(code);
  if (!id) {
    return { ok: false, error: `Tidak ada Household untuk "${code.trim()}"` };
  }
  const context = await getDistributionContext(id);
  if (!context) return { ok: false, error: "Household tidak ditemukan" };
  return { ok: true, context };
}

export type RecordResult =
  | { ok: true; context: DistributionContext; message: string }
  | { ok: false; error: string; context: DistributionContext | null };

export async function recordDistributionAction(input: {
  householdId: string;
  inventoryId: string;
  quantity: string;
  actor: string;
}): Promise<RecordResult> {
  if ((await deviceRole()) !== "VOLUNTEER") {
    return { ok: false, error: "Distribusi khusus perangkat Volunteer", context: null };
  }
  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      ok: false,
      error: "Jumlah harus lebih dari nol",
      context: await getDistributionContext(input.householdId),
    };
  }
  const actor = input.actor.trim() || "Relawan";

  const outcome = await recordDistribution({
    householdId: input.householdId,
    inventoryId: input.inventoryId,
    quantity,
    actor,
  });
  const context = await getDistributionContext(input.householdId);

  if (!outcome.ok) return { ok: false, error: outcome.reason, context };

  revalidatePath("/tents");
  revalidatePath("/allocate");
  revalidatePath("/presence");
  revalidatePath("/");
  return {
    ok: true,
    context: context!,
    message: `Distribusi tercatat di ${outcome.tentName}.`,
  };
}

export type BatchRecordResult =
  | { ok: true; message: string; context: DistributionContext }
  | { ok: false; error: string; context: DistributionContext | null };

export async function recordDistributionBatch(input: {
  householdId: string;
  actor: string;
  items: Array<{ inventoryId: string; quantity: string }>;
}): Promise<BatchRecordResult> {
  if ((await deviceRole()) !== "VOLUNTEER") {
    return { ok: false, error: "Distribusi khusus perangkat Volunteer", context: null };
  }
  const quantities = input.items
    .map((item) => ({ inventoryId: item.inventoryId, quantity: Number(item.quantity) }))
    .filter((item) => item.inventoryId && Number.isFinite(item.quantity) && item.quantity > 0);

  const contextBefore = await getDistributionContext(input.householdId);
  if (!contextBefore) return { ok: false, error: "Household tidak ditemukan", context: null };

  if (quantities.length === 0) {
    return { ok: false, error: "Belum ada barang dengan jumlah yang valid", context: contextBefore };
  }

  const actor = input.actor.trim() || "Relawan";
  for (const item of quantities) {
    const outcome = await recordDistribution({
      householdId: input.householdId,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      actor,
    });
    if (!outcome.ok) {
      return { ok: false, error: outcome.reason, context: await getDistributionContext(input.householdId) };
    }
  }

  const context = await getDistributionContext(input.householdId);
  revalidatePath("/distribute");
  revalidatePath("/presence");
  revalidatePath("/");
  return {
    ok: true,
    message: `Distribusi tersimpan untuk ${quantities.length} barang.`,
    context: context ?? contextBefore,
  };
}
