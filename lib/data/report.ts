import { prisma } from "@/lib/db";
import { residentEntitlement } from "@/lib/rules/entitlement";
import {
  classifyShortages,
  poskoCoverage,
  residentFlags,
  type PoskoCoverage,
  type ShortageItem,
  type StockLevel,
} from "@/lib/report/report";

export type RosterResident = {
  name: string;
  age: number;
  nik: string | null;
  flags: string[];
};

export type RosterHousehold = {
  id: string;
  name: string;
  residents: RosterResident[];
};

export type RosterTent = {
  name: string;
  headcount: number;
  households: RosterHousehold[];
};

export type ExportReport = {
  population: number;
  tents: RosterTent[];
  coverage: PoskoCoverage;
  shortages: ShortageItem[];
};

export async function buildExportReport(): Promise<ExportReport> {
  const [tents, stock] = await Promise.all([
    prisma.tent.findMany({
      orderBy: { name: "asc" },
      select: {
        name: true,
        households: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            residents: {
              orderBy: { age: "desc" },
              select: {
                name: true,
                age: true,
                nik: true,
                isPregnant: true,
                healthStatus: true,
                chronicConditions: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.inventory.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        name: true,
        unit: true,
        category: true,
        quantity: true,
        kcalPerUnit: true,
        allocations: { select: { quantity: true } },
      },
    }),
  ]);

  let population = 0;
  let kcalPerDay = 0;

  const rosterTents: RosterTent[] = tents.map((tent) => {
    const households: RosterHousehold[] = tent.households.map((household) => ({
      id: household.id,
      name: household.name,
      residents: household.residents.map((resident) => {
        kcalPerDay += residentEntitlement(resident).kcalPerDay;
        return {
          name: resident.name,
          age: resident.age,
          nik: resident.nik,
          flags: residentFlags({
            isPregnant: resident.isPregnant,
            healthStatus: resident.healthStatus,
            chronicConditions: resident.chronicConditions.map((c) => c.name),
          }),
        };
      }),
    }));
    const headcount = households.reduce((sum, h) => sum + h.residents.length, 0);
    population += headcount;
    return { name: tent.name, headcount, households };
  });

  const stockLevels: StockLevel[] = stock.map((item) => {
    const allocated = item.allocations.reduce((sum, a) => sum + a.quantity, 0);
    return {
      name: item.name,
      unit: item.unit,
      category: item.category,
      central: item.quantity,
      total: item.quantity + allocated,
      kcalPerUnit: item.kcalPerUnit,
    };
  });

  const kcalOnHand = stockLevels.reduce(
    (sum, item) => sum + item.total * item.kcalPerUnit,
    0,
  );

  return {
    population,
    tents: rosterTents,
    coverage: poskoCoverage({ population, kcalPerDay, kcalOnHand }),
    shortages: classifyShortages(stockLevels, kcalPerDay),
  };
}
