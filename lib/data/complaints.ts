import { prisma } from "@/lib/db";
import { classifyComplaint } from "@/lib/rules/classification";
import type { PriorityLevel } from "@/lib/rules/heat";

export type HealthStatus = "WELL" | "SICK" | "RECOVERING";

const RANK: Record<PriorityLevel, number> = { MERAH: 2, KUNING: 1, HIJAU: 0 };

export type ResidentHit = {
  id: string;
  name: string;
  age: number;
  healthStatus: string;
  householdId: string;
  householdName: string;
  tentName: string;
};

export async function searchResidents(rawQuery: string): Promise<ResidentHit[]> {
  const query = rawQuery.trim();
  if (!query) return [];

  const residents = await prisma.resident.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { nik: { contains: query } },
        { household: { id: { contains: query } } },
      ],
    },
    orderBy: { name: "asc" },
    take: 20,
    select: {
      id: true,
      name: true,
      age: true,
      healthStatus: true,
      household: {
        select: { id: true, name: true, tent: { select: { name: true } } },
      },
    },
  });

  return residents.map((r) => ({
    id: r.id,
    name: r.name,
    age: r.age,
    healthStatus: r.healthStatus,
    householdId: r.household.id,
    householdName: r.household.name,
    tentName: r.household.tent.name,
  }));
}

export type ComplaintSource = "VOLUNTEER" | "SELF";

export async function createComplaint(input: {
  residentId: string;
  symptoms: string[];
  source: ComplaintSource;
}): Promise<PriorityLevel> {
  const suggested = classifyComplaint(input.symptoms);
  await prisma.complaint.create({
    data: {
      residentId: input.residentId,
      freeText: input.symptoms.join(", "),
      symptoms: JSON.stringify(input.symptoms),
      source: input.source,
      suggestedPriority: suggested,
      confirmedPriority: null,
      confirmedBy: null,
    },
  });
  return suggested;
}

export async function confirmComplaint(input: {
  complaintId: string;
  priority: PriorityLevel;
  actor: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.update({
      where: { id: input.complaintId },
      data: { confirmedPriority: input.priority, confirmedBy: input.actor },
      select: { residentId: true },
    });
    await tx.resident.update({
      where: { id: complaint.residentId },
      data: { healthStatus: "SICK" },
    });
  });
}

export async function resolveComplaint(complaintId: string): Promise<void> {
  await prisma.complaint.update({
    where: { id: complaintId },
    data: { resolvedAt: new Date() },
  });
}

export async function setHealthStatus(input: {
  residentId: string;
  status: HealthStatus;
}): Promise<void> {
  await prisma.resident.update({
    where: { id: input.residentId },
    data: { healthStatus: input.status },
  });
}

export type OpenComplaint = {
  id: string;
  residentId: string;
  residentName: string;
  householdName: string;
  tentName: string;
  symptoms: string[];
  source: ComplaintSource;
  suggestedPriority: PriorityLevel;
  confirmedPriority: PriorityLevel | null;
  effectivePriority: PriorityLevel;
  confirmedBy: string | null;
  createdAt: Date;
};

export async function listOpenComplaints(): Promise<OpenComplaint[]> {
  const rows = await prisma.complaint.findMany({
    where: { resolvedAt: null },
    select: {
      id: true,
      symptoms: true,
      source: true,
      suggestedPriority: true,
      confirmedPriority: true,
      confirmedBy: true,
      createdAt: true,
      resident: {
        select: {
          id: true,
          name: true,
          household: { select: { name: true, tent: { select: { name: true } } } },
        },
      },
    },
  });

  return rows
    .map((c) => {
      const suggested = c.suggestedPriority as PriorityLevel;
      const confirmed = (c.confirmedPriority as PriorityLevel | null) ?? null;
      const effective = confirmed ?? suggested;
      return {
        id: c.id,
        residentId: c.resident.id,
        residentName: c.resident.name,
        householdName: c.resident.household.name,
        tentName: c.resident.household.tent.name,
        symptoms: parseSymptoms(c.symptoms),
        source: c.source as ComplaintSource,
        suggestedPriority: suggested,
        confirmedPriority: confirmed,
        effectivePriority: effective,
        confirmedBy: c.confirmedBy,
        createdAt: c.createdAt,
      };
    })
    .sort(
      (a, b) =>
        RANK[b.effectivePriority] - RANK[a.effectivePriority] ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    );
}

function parseSymptoms(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw ? [raw] : [];
  }
}
