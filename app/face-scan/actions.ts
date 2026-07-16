"use server";

import { prisma } from "@/lib/db";

export type SimulatedMatch = {
  residentName: string;
  age: number;
  householdId: string;
  householdName: string;
  tentName: string;
};

export async function simulateMatch(): Promise<SimulatedMatch | null> {
  const total = await prisma.resident.count();
  if (total === 0) return null;

  const skip = Math.floor(Math.random() * total);
  const resident = await prisma.resident.findFirst({
    skip,
    orderBy: { id: "asc" },
    select: {
      name: true,
      age: true,
      household: {
        select: {
          id: true,
          name: true,
          tent: { select: { name: true } },
        },
      },
    },
  });

  if (!resident) return null;

  return {
    residentName: resident.name,
    age: resident.age,
    householdId: resident.household.id,
    householdName: resident.household.name,
    tentName: resident.household.tent.name,
  };
}
