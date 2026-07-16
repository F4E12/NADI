import { prisma } from "@/lib/db";

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
      central: i.quantity,
      allocated,
      total: i.quantity + allocated,
    };
  });
}
