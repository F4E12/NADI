import { prisma } from "@/lib/db";
import { listTentSummaries } from "@/lib/data/tents";
import { deviceRole } from "@/lib/device-role";
import { HomeShowcase } from "@/components/home-showcase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [households, residents, tents, openComplaints, summaries, role] =
    await Promise.all([
      prisma.household.count(),
      prisma.resident.count(),
      prisma.tent.count(),
      prisma.complaint.count({ where: { resolvedAt: null } }),
      listTentSummaries(),
      deviceRole(),
    ]);

  return (
    <HomeShowcase
      role={role}
      metrics={{ households, residents, tents, openComplaints }}
      tents={summaries.map((tent) => ({
        id: tent.id,
        name: tent.name,
        occupancy: tent.occupancy,
        capacity: tent.maxCapacity,
        kcal: tent.requirement.kcalPerDay,
      }))}
    />
  );
}
