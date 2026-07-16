import { prisma } from "@/lib/db";
import {
  householdEntitlement,
  type Entitlement,
} from "@/lib/rules/entitlement";
import { distributionDecision } from "@/lib/rules/allocation";

function periodStart(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function resolveHousehold(input: string): Promise<string | null> {
  const raw = input.trim();
  if (!raw) return null;

  const candidate = (raw.includes("/") ? raw.slice(raw.lastIndexOf("/") + 1) : raw).trim();

  for (const id of [candidate, candidate.toUpperCase()]) {
    const byId = await prisma.household.findUnique({
      where: { id },
      select: { id: true },
    });
    if (byId) return byId.id;
  }

  const byFallback = await prisma.household.findUnique({
    where: { fallbackCode: candidate },
    select: { id: true },
  });
  return byFallback?.id ?? null;
}

export type DistributableStock = {
  allocationId: string;
  inventoryId: string;
  name: string;
  unit: string;
  isHighProtein: boolean;
  available: number;
  collectedThisPeriod: boolean;
};

export type Presence = { tentName: string; at: Date } | null;

export type DistributionContext = {
  householdId: string;
  householdName: string;
  tentId: string;
  tentName: string;
  entitlement: Entitlement;
  stock: DistributableStock[];
  lastPresence: Presence;
};

export async function getDistributionContext(
  householdId: string,
): Promise<DistributionContext | null> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: {
      id: true,
      name: true,
      tentId: true,
      tent: {
        select: {
          name: true,
          allocations: {
            select: {
              id: true,
              quantity: true,
              inventory: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  isHighProtein: true,
                },
              },
            },
          },
        },
      },
      residents: { select: { age: true, isPregnant: true } },
    },
  });

  if (!household) return null;

  const since = periodStart();
  const collected = await prisma.transactionLog.findMany({
    where: { householdId, kind: "DISTRIBUTION", createdAt: { gte: since } },
    select: { allocationId: true },
  });
  const collectedAllocationIds = new Set(collected.map((c) => c.allocationId));

  const stock: DistributableStock[] = household.tent.allocations
    .map((a) => ({
      allocationId: a.id,
      inventoryId: a.inventory.id,
      name: a.inventory.name,
      unit: a.inventory.unit,
      isHighProtein: a.inventory.isHighProtein,
      available: a.quantity,
      collectedThisPeriod: collectedAllocationIds.has(a.id),
    }))
    .sort((x, y) => x.name.localeCompare(y.name));

  return {
    householdId: household.id,
    householdName: household.name,
    tentId: household.tentId,
    tentName: household.tent.name,
    entitlement: householdEntitlement(household.residents),
    stock,
    lastPresence: await mostRecentPresence(household.id),
  };
}

export async function mostRecentPresence(householdId: string): Promise<Presence> {
  const last = await prisma.transactionLog.findFirst({
    where: { householdId },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      allocation: { select: { tent: { select: { name: true } } } },
    },
  });
  if (!last) return null;
  return {
    tentName: last.allocation?.tent.name ?? "Posko",
    at: last.createdAt,
  };
}

export type DistributionOutcome =
  | { ok: true; tentName: string; at: Date }
  | { ok: false; reason: string };

export async function recordDistribution(input: {
  householdId: string;
  inventoryId: string;
  quantity: number;
  actor: string;
}): Promise<DistributionOutcome> {
  const household = await prisma.household.findUnique({
    where: { id: input.householdId },
    select: {
      tentId: true,
      tent: { select: { name: true } },
      residents: { select: { age: true, isPregnant: true } },
    },
  });
  if (!household) return { ok: false, reason: "Household tidak ditemukan" };

  const inventory = await prisma.inventory.findUnique({
    where: { id: input.inventoryId },
    select: { name: true, unit: true },
  });
  if (!inventory) return { ok: false, reason: "Stok tidak ditemukan" };

  const allocation = await prisma.tentAllocation.findUnique({
    where: {
      tentId_inventoryId: { tentId: household.tentId, inventoryId: input.inventoryId },
    },
    select: { id: true, quantity: true },
  });
  if (!allocation) {
    return { ok: false, reason: `Tenda ini tidak punya alokasi ${inventory.name}` };
  }

  const since = periodStart();
  const alreadyCollected = await prisma.transactionLog.count({
    where: {
      householdId: input.householdId,
      allocationId: allocation.id,
      kind: "DISTRIBUTION",
      createdAt: { gte: since },
    },
  });

  const entitlement = householdEntitlement(household.residents);
  const decision = distributionDecision({
    stockName: inventory.name,
    unit: inventory.unit,
    requestedQuantity: input.quantity,
    tentAllocationQuantity: allocation.quantity,
    householdKcalPerDay: entitlement.kcalPerDay,
    alreadyCollectedThisPeriod: alreadyCollected > 0,
  });
  if (!decision.allowed) return { ok: false, reason: decision.reason };

  const entry = await prisma.$transaction(async (tx) => {
    await tx.tentAllocation.update({
      where: { id: allocation.id },
      data: { quantity: { decrement: input.quantity } },
    });
    return tx.transactionLog.create({
      data: {
        kind: "DISTRIBUTION",
        quantity: input.quantity,
        actor: input.actor,
        householdId: input.householdId,
        allocationId: allocation.id,
      },
      select: { createdAt: true },
    });
  });

  return { ok: true, tentName: household.tent.name, at: entry.createdAt };
}
