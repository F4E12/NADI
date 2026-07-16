import { prisma } from "@/lib/db";
import { issueDompetGizi } from "@/lib/dompet";
import {
  householdEntitlement,
  residentEntitlement,
  type Entitlement,
} from "@/lib/rules/entitlement";

export type HealthStatus = "WELL" | "SICK" | "RECOVERING";

export type NewResident = {
  name: string;
  age: number;
  nik: string | null;
  isPregnant: boolean;
  healthStatus: HealthStatus;
  chronicConditions: string[];
};

export type HouseholdSearchResult = {
  id: string;
  name: string;
  tentName: string;
  residentCount: number;
  fallbackCode: string;
};

export async function searchHouseholds(
  rawQuery: string,
): Promise<HouseholdSearchResult[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  const households = await prisma.household.findMany({
    where: {
      OR: [
        { id: { contains: query } },
        { name: { contains: query } },
        { fallbackCode: { contains: query } },
        { residents: { some: { name: { contains: query } } } },
        { residents: { some: { nik: { contains: query } } } },
      ],
    },
    orderBy: { name: "asc" },
    take: 25,
    select: {
      id: true,
      name: true,
      fallbackCode: true,
      tent: { select: { name: true } },
      _count: { select: { residents: true } },
    },
  });

  return households.map((h) => ({
    id: h.id,
    name: h.name,
    tentName: h.tent.name,
    residentCount: h._count.residents,
    fallbackCode: h.fallbackCode,
  }));
}

export type ResidentDetail = {
  id: string;
  name: string;
  age: number;
  nik: string | null;
  isPregnant: boolean;
  healthStatus: string;
  chronicConditions: string[];
  entitlement: Entitlement;
};

export type HouseholdDetail = {
  id: string;
  name: string;
  qrPayload: string;
  fallbackCode: string;
  tentId: string;
  tentName: string;
  residents: ResidentDetail[];
  entitlement: Entitlement;
};

export async function getHousehold(id: string): Promise<HouseholdDetail | null> {
  const household = await prisma.household.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      qrPayload: true,
      fallbackCode: true,
      tentId: true,
      tent: { select: { name: true } },
      residents: {
        orderBy: { age: "desc" },
        select: {
          id: true,
          name: true,
          age: true,
          nik: true,
          isPregnant: true,
          healthStatus: true,
          chronicConditions: { select: { name: true } },
        },
      },
    },
  });

  if (!household) return null;

  const residents: ResidentDetail[] = household.residents.map((r) => ({
    id: r.id,
    name: r.name,
    age: r.age,
    nik: r.nik,
    isPregnant: r.isPregnant,
    healthStatus: r.healthStatus,
    chronicConditions: r.chronicConditions.map((c) => c.name),
    entitlement: residentEntitlement(r),
  }));

  return {
    id: household.id,
    name: household.name,
    qrPayload: household.qrPayload,
    fallbackCode: household.fallbackCode,
    tentId: household.tentId,
    tentName: household.tent.name,
    residents,
    entitlement: householdEntitlement(household.residents),
  };
}

export type CreateHouseholdInput = {
  name: string;
  tentId: string;
  residents: NewResident[];
};

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function createHousehold(
  input: CreateHouseholdInput,
): Promise<{ id: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const dompet = issueDompetGizi();
    try {
      const created = await prisma.household.create({
        data: {
          id: dompet.householdId,
          name: input.name,
          qrPayload: dompet.qrPayload,
          fallbackCode: dompet.fallbackCode,
          tentId: input.tentId,
          residents: {
            create: input.residents.map(residentCreateData),
          },
        },
        select: { id: true },
      });
      return created;
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }
  throw new Error("Could not mint a unique Dompet Gizi after several attempts");
}

export async function addResident(
  householdId: string,
  resident: NewResident,
): Promise<void> {
  await prisma.resident.create({
    data: { householdId, ...residentCreateData(resident) },
  });
}

export async function householdExists(id: string): Promise<boolean> {
  const found = await prisma.household.findUnique({
    where: { id },
    select: { id: true },
  });
  return found !== null;
}

function residentCreateData(resident: NewResident) {
  return {
    name: resident.name,
    age: resident.age,
    nik: resident.nik,
    isPregnant: resident.isPregnant,
    healthStatus: resident.healthStatus,
    chronicConditions: {
      create: resident.chronicConditions.map((name) => ({ name })),
    },
  };
}
