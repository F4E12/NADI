"use server";

import { revalidatePath } from "next/cache";
import {
  addResident,
  createHousehold,
  householdExists,
  type HealthStatus,
  type NewResident,
} from "@/lib/data/households";
import { deviceRole } from "@/lib/device-role";
import { qrSvg } from "@/lib/qr";
import { registrationHealthStatus } from "@/lib/registration-policy";

export type ResidentInput = {
  name: string;
  age: string;
  nik: string;
  isPregnant: boolean;
  healthStatus: HealthStatus;
  chronicConditions: string[];
};

export type RegisterResult =
  | { ok: true; id: string; qrSvg: string; fallbackCode: string }
  | { ok: false; error: string };

export type AddResidentResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const HEALTH_STATUSES: HealthStatus[] = ["WELL", "SICK", "RECOVERING"];

function parseResident(
  input: ResidentInput,
  role: "VOLUNTEER" | "RESIDENT",
): NewResident | { error: string } {
  const name = input.name.trim();
  if (!name) return { error: "Setiap Resident harus punya nama" };

  const age = Number(input.age);
  if (!Number.isInteger(age) || age < 0 || age > 120) {
    return { error: `Umur tidak valid untuk ${name}` };
  }

  const requestedHealthStatus = HEALTH_STATUSES.includes(input.healthStatus)
    ? input.healthStatus
    : "WELL";
  const healthStatus = registrationHealthStatus(requestedHealthStatus, role);

  const nik = input.nik.trim();

  return {
    name,
    age,
    nik: nik === "" ? null : nik,
    isPregnant: input.isPregnant && age >= 12,
    healthStatus,
    chronicConditions: input.chronicConditions
      .map((c) => c.trim())
      .filter((c) => c.length > 0),
  };
}

export async function registerHousehold(input: {
  name: string;
  tentId: string;
  residents: ResidentInput[];
}): Promise<RegisterResult> {
  const role = await deviceRole();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Household harus punya nama keluarga" };
  if (!input.tentId) return { ok: false, error: "Pilih Tenda untuk Household ini" };
  if (input.residents.length === 0) {
    return { ok: false, error: "Household harus punya minimal satu Resident" };
  }

  const residents: NewResident[] = [];
  for (const raw of input.residents) {
    const parsed = parseResident(raw, role);
    if ("error" in parsed) return { ok: false, error: parsed.error };
    residents.push(parsed);
  }

  const household = await createHousehold({
    name,
    tentId: input.tentId,
    residents,
  });

  revalidatePath("/tents");
  revalidatePath("/");
  return {
    ok: true,
    id: household.id,
    qrSvg: await qrSvg(household.qrPayload),
    fallbackCode: household.fallbackCode,
  };
}

export async function addResidentToHousehold(
  householdId: string,
  input: ResidentInput,
): Promise<AddResidentResult> {
  if ((await deviceRole()) !== "VOLUNTEER") {
    return { ok: false, error: "Registrasi khusus perangkat Volunteer" };
  }
  if (!(await householdExists(householdId))) {
    return { ok: false, error: "Household tidak ditemukan" };
  }

  const parsed = parseResident(input, "VOLUNTEER");
  if ("error" in parsed) return { ok: false, error: parsed.error };

  await addResident(householdId, parsed);

  revalidatePath(`/households/${householdId}`);
  revalidatePath("/tents");
  revalidatePath("/");
  return { ok: true, id: householdId };
}
