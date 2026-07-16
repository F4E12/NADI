import { prisma } from "@/lib/db";

export type PresenceResult = {
  id: string;
  name: string;
  homeTent: string;
  residentCount: number;
  presence: { tentName: string; at: Date } | null;
};

export async function searchPresence(rawQuery: string): Promise<PresenceResult[]> {
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
      tent: { select: { name: true } },
      _count: { select: { residents: true } },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          createdAt: true,
          allocation: { select: { tent: { select: { name: true } } } },
        },
      },
    },
  });

  return households.map((h) => {
    const last = h.transactions[0];
    return {
      id: h.id,
      name: h.name,
      homeTent: h.tent.name,
      residentCount: h._count.residents,
      presence: last
        ? { tentName: last.allocation?.tent.name ?? "Posko", at: last.createdAt }
        : null,
    };
  });
}
