import { prisma } from "@/lib/db";
import {
  householdEntitlement,
  tentEntitlement,
  type Entitlement,
} from "@/lib/rules/entitlement";
import {
  allocatedKcalOf,
  daysOfCover,
  tentComposition,
  type TentComposition,
} from "@/lib/rules/allocation";

export type TentSummary = {
  id: string;
  name: string;
  maxCapacity: number;
  occupancy: number;
  householdCount: number;
  composition: TentComposition;
  requirement: Entitlement;
  allocatedKcal: number;
  daysOfCover: number;
};

export async function listTentSummaries(): Promise<TentSummary[]> {
  const tents = await prisma.tent.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      maxCapacity: true,
      households: {
        select: {
          id: true,
          residents: { select: { age: true, isPregnant: true } },
        },
      },
      allocations: {
        select: {
          quantity: true,
          inventory: { select: { kcalPerUnit: true } },
        },
      },
    },
  });

  return tents.map((tent) => {
    const residents = tent.households.flatMap((h) => h.residents);
    const requirement = tentEntitlement(
      tent.households.map((h) => householdEntitlement(h.residents)),
    );
    const allocatedKcal = allocatedKcalOf(
      tent.allocations.map((a) => ({
        quantity: a.quantity,
        kcalPerUnit: a.inventory.kcalPerUnit,
      })),
    );
    return {
      id: tent.id,
      name: tent.name,
      maxCapacity: tent.maxCapacity,
      occupancy: residents.length,
      householdCount: tent.households.length,
      composition: tentComposition(residents),
      requirement,
      allocatedKcal,
      daysOfCover: daysOfCover(allocatedKcal, requirement.kcalPerDay),
    };
  });
}

export type TentOption = { id: string; name: string };

export async function listTentOptions(): Promise<TentOption[]> {
  return prisma.tent.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
