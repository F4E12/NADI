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
import {
  isUniqueConstraintError,
  normalizedName,
  type MutationResult,
} from "@/lib/data/mutation";

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

async function tentNameIsTaken(name: string, excludingId?: string): Promise<boolean> {
  const tents = await prisma.tent.findMany({
    where: excludingId ? { id: { not: excludingId } } : undefined,
    select: { name: true },
  });
  const candidate = normalizedName(name);
  return tents.some((tent) => normalizedName(tent.name) === candidate);
}

export async function createTent(input: {
  name: string;
  maxCapacity: number;
}): Promise<MutationResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Nama Tenda wajib diisi" };
  if (!Number.isInteger(input.maxCapacity) || input.maxCapacity <= 0) {
    return { ok: false, error: "Kapasitas harus berupa bilangan bulat lebih dari nol" };
  }
  if (await tentNameIsTaken(name)) {
    return { ok: false, error: "Nama Tenda sudah digunakan" };
  }

  try {
    await prisma.tent.create({ data: { name, maxCapacity: input.maxCapacity } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: "Nama Tenda sudah digunakan" };
    }
    throw error;
  }
  return { ok: true };
}

export async function renameTent(input: {
  id: string;
  name: string;
}): Promise<MutationResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Nama Tenda wajib diisi" };

  const existing = await prisma.tent.findUnique({
    where: { id: input.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Tenda tidak ditemukan" };
  if (await tentNameIsTaken(name, input.id)) {
    return { ok: false, error: "Nama Tenda sudah digunakan" };
  }

  try {
    await prisma.tent.update({ where: { id: input.id }, data: { name } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: "Nama Tenda sudah digunakan" };
    }
    throw error;
  }
  return { ok: true };
}

export async function deleteTent(id: string): Promise<MutationResult> {
  const tent = await prisma.tent.findUnique({
    where: { id },
    select: {
      _count: { select: { households: true, allocations: true } },
    },
  });
  if (!tent) return { ok: false, error: "Tenda tidak ditemukan" };
  if (tent._count.households > 0) {
    return {
      ok: false,
      error: `Tenda masih berisi ${tent._count.households} Household`,
    };
  }
  if (tent._count.allocations > 0) {
    return {
      ok: false,
      error: `Tenda masih memiliki ${tent._count.allocations} alokasi atau riwayat stok`,
    };
  }

  await prisma.tent.delete({ where: { id } });
  return { ok: true };
}
