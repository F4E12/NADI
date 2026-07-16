import { prisma } from "@/lib/db";
import {
  householdEntitlement,
  tentEntitlement,
  type Entitlement,
} from "@/lib/rules/entitlement";
import {
  allocatedKcalOf,
  allocationCheck,
  daysOfCover,
  tentComposition,
  type TentComposition,
} from "@/lib/rules/allocation";

export type AllocationLine = {
  inventoryId: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  isHighProtein: boolean;
  kcal: number;
};

export type TentAllocationView = {
  id: string;
  name: string;
  maxCapacity: number;
  occupancy: number;
  requirement: Entitlement;
  composition: TentComposition;
  allocations: AllocationLine[];
  allocatedKcal: number;
  daysOfCover: number;
};

export async function getTentAllocationView(
  tentId: string,
): Promise<TentAllocationView | null> {
  const tent = await prisma.tent.findUnique({
    where: { id: tentId },
    select: {
      id: true,
      name: true,
      maxCapacity: true,
      households: { select: { residents: { select: { age: true, isPregnant: true } } } },
      allocations: {
        select: {
          quantity: true,
          inventory: {
            select: {
              id: true,
              name: true,
              category: true,
              unit: true,
              isHighProtein: true,
              kcalPerUnit: true,
            },
          },
        },
      },
    },
  });

  if (!tent) return null;

  const residents = tent.households.flatMap((h) => h.residents);
  const requirement = tentEntitlement(
    tent.households.map((h) => householdEntitlement(h.residents)),
  );

  const allocations: AllocationLine[] = tent.allocations
    .map((a) => ({
      inventoryId: a.inventory.id,
      name: a.inventory.name,
      category: a.inventory.category,
      unit: a.inventory.unit,
      quantity: a.quantity,
      isHighProtein: a.inventory.isHighProtein,
      kcal: a.quantity * a.inventory.kcalPerUnit,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

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
    requirement,
    composition: tentComposition(residents),
    allocations,
    allocatedKcal,
    daysOfCover: daysOfCover(allocatedKcal, requirement.kcalPerDay),
  };
}

export type AllocationOutcome = { ok: true } | { ok: false; reason: string };

export async function applyAllocation(input: {
  tentId: string;
  inventoryId: string;
  quantity: number;
  actor: string;
}): Promise<AllocationOutcome> {
  const [item, tent] = await Promise.all([
    prisma.inventory.findUnique({
      where: { id: input.inventoryId },
      select: { name: true, unit: true, isHighProtein: true, quantity: true },
    }),
    prisma.tent.findUnique({
      where: { id: input.tentId },
      select: {
        households: { select: { residents: { select: { age: true, isPregnant: true } } } },
      },
    }),
  ]);

  if (!item) return { ok: false, reason: "Stok tidak ditemukan" };
  if (!tent) return { ok: false, reason: "Tenda tidak ditemukan" };

  const composition = tentComposition(tent.households.flatMap((h) => h.residents));

  const decision = allocationCheck({
    stock: { name: item.name, unit: item.unit, isHighProtein: item.isHighProtein },
    requestedQuantity: input.quantity,
    availableQuantity: item.quantity,
    tent: composition,
  });
  if (!decision.allowed) return { ok: false, reason: decision.reason };

  await prisma.$transaction(async (tx) => {
    await tx.inventory.update({
      where: { id: input.inventoryId },
      data: { quantity: { decrement: input.quantity } },
    });
    const allocation = await tx.tentAllocation.upsert({
      where: {
        tentId_inventoryId: {
          tentId: input.tentId,
          inventoryId: input.inventoryId,
        },
      },
      create: {
        tentId: input.tentId,
        inventoryId: input.inventoryId,
        quantity: input.quantity,
      },
      update: { quantity: { increment: input.quantity } },
      select: { id: true },
    });
    await tx.transactionLog.create({
      data: {
        kind: "ALLOCATION",
        quantity: input.quantity,
        actor: input.actor,
        allocationId: allocation.id,
      },
    });
  });

  return { ok: true };
}

export type InventoryPoolItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  available: number;
  isHighProtein: boolean;
};

export async function listInventoryPool(): Promise<InventoryPoolItem[]> {
  const items = await prisma.inventory.findMany({
    orderBy: [{ isHighProtein: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      quantity: true,
      isHighProtein: true,
    },
  });
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    unit: i.unit,
    available: i.quantity,
    isHighProtein: i.isHighProtein,
  }));
}
