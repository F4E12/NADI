"use server";

import { revalidatePath } from "next/cache";
import {
  createComplaint,
  confirmComplaint,
  resolveComplaint,
  searchResidents,
  setHealthStatus,
  type HealthStatus,
  type ResidentHit,
} from "@/lib/data/complaints";
import type { PriorityLevel } from "@/lib/rules/heat";

export async function searchResidentsAction(query: string): Promise<ResidentHit[]> {
  return searchResidents(query);
}

export type ComplaintResult =
  | { ok: true; suggested: PriorityLevel }
  | { ok: false; error: string };

export async function createComplaintAction(input: {
  residentId: string;
  symptoms: string[];
}): Promise<ComplaintResult> {
  if (!input.residentId) return { ok: false, error: "Pilih Resident dulu" };
  if (input.symptoms.length === 0) {
    return { ok: false, error: "Pilih minimal satu gejala" };
  }
  const suggested = await createComplaint(input);
  revalidatePath("/complaints");
  revalidatePath("/tents");
  return { ok: true, suggested };
}

const PRIORITIES: PriorityLevel[] = ["MERAH", "KUNING", "HIJAU"];

export async function confirmComplaintAction(input: {
  complaintId: string;
  priority: PriorityLevel;
  actor: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!PRIORITIES.includes(input.priority)) {
    return { ok: false, error: "Priority tidak valid" };
  }
  const actor = input.actor.trim();
  if (!actor) return { ok: false, error: "Nama pengonfirmasi wajib diisi" };

  await confirmComplaint({ ...input, actor });
  revalidatePath("/complaints");
  revalidatePath("/tents");
  revalidatePath("/");
  return { ok: true };
}

export async function resolveComplaintAction(complaintId: string): Promise<void> {
  await resolveComplaint(complaintId);
  revalidatePath("/complaints");
  revalidatePath("/tents");
  revalidatePath("/");
}

const STATUSES: HealthStatus[] = ["WELL", "SICK", "RECOVERING"];

export async function setHealthStatusAction(input: {
  residentId: string;
  status: HealthStatus;
}): Promise<{ ok: boolean; error?: string }> {
  if (!STATUSES.includes(input.status)) return { ok: false, error: "Status tidak valid" };
  await setHealthStatus(input);
  revalidatePath("/complaints");
  revalidatePath("/tents");
  revalidatePath("/");
  return { ok: true };
}
