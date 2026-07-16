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
