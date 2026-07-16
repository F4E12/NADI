"use server";

import { revalidatePath } from "next/cache";
import {
  getDistributionContext,
  recordDistribution,
  resolveHousehold,
  type DistributionContext,
} from "@/lib/data/distribution";

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
