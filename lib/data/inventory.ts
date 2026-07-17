import { prisma } from "@/lib/db";
import {
  isUniqueConstraintError,
  normalizedName,
  type MutationResult,
} from "@/lib/data/mutation";

export type StockItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  isHighProtein: boolean;
};

export async function listStock(): Promise<StockItem[]> {
  return prisma.inventory.findMany({
    orderBy: [{ isHighProtein: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      isHighProtein: true,
    },
  });
}

export type InventoryOverviewItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  isHighProtein: boolean;
  kcalPerUnit: number;
  central: number;
  allocated: number;
  total: number;
};

export async function listInventoryOverview(): Promise<InventoryOverviewItem[]> {
  const items = await prisma.inventory.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      quantity: true,
      isHighProtein: true,
      kcalPerUnit: true,
      allocations: { select: { quantity: true } },
    },
  });

  return items.map((i) => {
    const allocated = i.allocations.reduce((sum, a) => sum + a.quantity, 0);
    return {
      id: i.id,
      name: i.name,
      category: i.category,
      unit: i.unit,
      isHighProtein: i.isHighProtein,
      kcalPerUnit: i.kcalPerUnit,
      central: i.quantity,
      allocated,
      total: i.quantity + allocated,
    };
  });
}

async function inventoryNameIsTaken(name: string): Promise<boolean> {
  const items = await prisma.inventory.findMany({ select: { name: true } });
  const candidate = normalizedName(name);
  return items.some((item) => normalizedName(item.name) === candidate);
}

export async function createInventoryItem(input: {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  kcalPerUnit: number;
  isHighProtein: boolean;
}): Promise<MutationResult> {
  const name = input.name.trim();
  const category = input.category.trim();
  const unit = input.unit.trim();

  if (!name || !category || !unit) {
    return { ok: false, error: "Nama, kategori, dan satuan wajib diisi" };
  }
  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    return { ok: false, error: "Jumlah pool pusat harus nol atau lebih" };
  }
  if (!Number.isFinite(input.kcalPerUnit) || input.kcalPerUnit < 0) {
    return { ok: false, error: "Kkal per satuan harus nol atau lebih" };
  }
  if (await inventoryNameIsTaken(name)) {
    return { ok: false, error: "Nama inventaris sudah digunakan" };
  }

  try {
    await prisma.inventory.create({
      data: {
        name,
        category,
        unit,
        quantity: input.quantity,
        kcalPerUnit: input.kcalPerUnit,
        isHighProtein: input.isHighProtein,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: "Nama inventaris sudah digunakan" };
    }
    throw error;
  }
  return { ok: true };
}

export async function updateInventoryQuantity(input: {
  id: string;
  quantity: number;
}): Promise<MutationResult> {
  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    return { ok: false, error: "Jumlah pool pusat harus nol atau lebih" };
  }

  const existing = await prisma.inventory.findUnique({
    where: { id: input.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Inventaris tidak ditemukan" };

  await prisma.inventory.update({
    where: { id: input.id },
    data: { quantity: input.quantity },
  });
  return { ok: true };
}

export async function deleteInventoryItem(id: string): Promise<MutationResult> {
  const item = await prisma.inventory.findUnique({
    where: { id },
    select: { _count: { select: { allocations: true } } },
  });
  if (!item) return { ok: false, error: "Inventaris tidak ditemukan" };
  if (item._count.allocations > 0) {
    return {
      ok: false,
      error: `Inventaris masih memiliki ${item._count.allocations} alokasi atau riwayat stok`,
    };
  }

  await prisma.inventory.delete({ where: { id } });
  return { ok: true };
}
