import { prisma } from "@/lib/db";
import { householdEntitlement, tentEntitlement } from "@/lib/rules/entitlement";
import { allocatedKcalOf, daysOfCover } from "@/lib/rules/allocation";
import { tentHeat, type Heat, type PriorityLevel } from "@/lib/rules/heat";

const SEVERITY: Record<PriorityLevel, number> = { MERAH: 2, KUNING: 1, HIJAU: 0 };

export type TentHeat = {
  id: string;
  name: string;
  heat: Heat;
  occupancy: number;
  maxCapacity: number;
  daysOfCover: number;
  chronicCount: number;
  sickCount: number;
  complaintCounts: Record<PriorityLevel, number>;
};

export async function listTentHeat(): Promise<TentHeat[]> {
  const tents = await prisma.tent.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      maxCapacity: true,
      households: {
        select: {
          residents: {
            select: {
              age: true,
              isPregnant: true,
              healthStatus: true,
              chronicConditions: { select: { id: true } },
              complaints: {
                where: { resolvedAt: null, confirmedPriority: null },
                select: { suggestedPriority: true },
              },
            },
          },
        },
      },
      allocations: {
        select: { quantity: true, inventory: { select: { kcalPerUnit: true } } },
      },
    },
  });

  return tents
    .map((tent) => {
      const residents = tent.households.flatMap((h) => h.residents);
      const chronicCount = residents.filter((r) => r.chronicConditions.length > 0).length;
      const sickCount = residents.filter((r) => r.healthStatus === "SICK").length;
      const openComplaints = residents.flatMap((r) =>
        r.complaints.map((c) => c.suggestedPriority as PriorityLevel),
      );
      const complaintCounts: Record<PriorityLevel, number> = {
        MERAH: 0,
        KUNING: 0,
        HIJAU: 0,
      };
      for (const c of openComplaints) complaintCounts[c] += 1;

      const requirement = tentEntitlement(
        tent.households.map((h) => householdEntitlement(h.residents)),
      );
      const allocatedKcal = allocatedKcalOf(
        tent.allocations.map((a) => ({
          quantity: a.quantity,
          kcalPerUnit: a.inventory.kcalPerUnit,
        })),
      );
      const cover = daysOfCover(allocatedKcal, requirement.kcalPerDay);

      const heat = tentHeat({
        chronicVulnerabilityCount: chronicCount,
        activeIllnessCount: sickCount,
        openComplaints,
        occupancy: residents.length,
        maxCapacity: tent.maxCapacity,
        daysOfCover: cover,
      });

      return {
        id: tent.id,
        name: tent.name,
        heat,
        occupancy: residents.length,
        maxCapacity: tent.maxCapacity,
        daysOfCover: cover,
        chronicCount,
        sickCount,
        complaintCounts,
      };
    })
    .sort(
      (a, b) =>
        SEVERITY[b.heat.colour] - SEVERITY[a.heat.colour] ||
        b.heat.reasons.length - a.heat.reasons.length ||
        a.name.localeCompare(b.name),
    );
}

export type HeatResident = {
  id: string;
  name: string;
  age: number;
  healthStatus: string;
  isPregnant: boolean;
  chronicConditions: string[];
};

export type HeatComplaint = {
  residentName: string;
  suggestedPriority: PriorityLevel;
  symptoms: string[];
};

export type TentHeatDetail = {
  id: string;
  name: string;
  maxCapacity: number;
  occupancy: number;
  heat: Heat;
  daysOfCover: number;
  residents: HeatResident[];
  openComplaints: HeatComplaint[];
};

export async function getTentHeatDetail(
  tentId: string,
): Promise<TentHeatDetail | null> {
  const tent = await prisma.tent.findUnique({
    where: { id: tentId },
    select: {
      id: true,
      name: true,
      maxCapacity: true,
      households: {
        select: {
          residents: {
            orderBy: { age: "desc" },
            select: {
              id: true,
              name: true,
              age: true,
              isPregnant: true,
              healthStatus: true,
              chronicConditions: { select: { name: true } },
              complaints: {
                where: { resolvedAt: null, confirmedPriority: null },
                select: { suggestedPriority: true, symptoms: true },
              },
            },
          },
        },
      },
      allocations: {
        select: { quantity: true, inventory: { select: { kcalPerUnit: true } } },
      },
    },
  });

  if (!tent) return null;

  const residents = tent.households.flatMap((h) => h.residents);
  const chronicCount = residents.filter((r) => r.chronicConditions.length > 0).length;
  const sickCount = residents.filter((r) => r.healthStatus === "SICK").length;

  const openComplaints: HeatComplaint[] = residents.flatMap((r) =>
    r.complaints.map((c) => ({
      residentName: r.name,
      suggestedPriority: c.suggestedPriority as PriorityLevel,
      symptoms: parseSymptoms(c.symptoms),
    })),
  );

  const requirement = tentEntitlement(
    tent.households.map((h) => householdEntitlement(h.residents)),
  );
  const allocatedKcal = allocatedKcalOf(
    tent.allocations.map((a) => ({
      quantity: a.quantity,
      kcalPerUnit: a.inventory.kcalPerUnit,
    })),
  );
  const cover = daysOfCover(allocatedKcal, requirement.kcalPerDay);

  const heat = tentHeat({
    chronicVulnerabilityCount: chronicCount,
    activeIllnessCount: sickCount,
    openComplaints: openComplaints.map((c) => c.suggestedPriority),
    occupancy: residents.length,
    maxCapacity: tent.maxCapacity,
    daysOfCover: cover,
  });

  return {
    id: tent.id,
    name: tent.name,
    maxCapacity: tent.maxCapacity,
    occupancy: residents.length,
    heat,
    daysOfCover: cover,
    residents: residents.map((r) => ({
      id: r.id,
      name: r.name,
      age: r.age,
      isPregnant: r.isPregnant,
      healthStatus: r.healthStatus,
      chronicConditions: r.chronicConditions.map((c) => c.name),
    })),
    openComplaints,
  };
}

function parseSymptoms(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw ? [raw] : [];
  }
}
