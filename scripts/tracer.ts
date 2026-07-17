import { prisma } from "@/lib/db";
import { createHousehold, getHousehold } from "@/lib/data/households";
import {
  applyAllocation,
  getTentAllocationView,
  listInventoryPool,
} from "@/lib/data/allocations";
import {
  mostRecentPresence,
  recordDistribution,
  resolveHousehold,
} from "@/lib/data/distribution";
import { searchPresence } from "@/lib/data/presence";
import { createComplaint, confirmComplaint } from "@/lib/data/complaints";
import { getTentHeatDetail } from "@/lib/data/heat";
import { allocationDecision } from "@/lib/rules/allocation";

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (ok) {
    pass++;
    console.log(`  ok  ${name}`);
  } else {
    fail++;
    console.log(`FAIL  ${name}  ${extra}`);
  }
};
const step = (s: string) => console.log(`\n— ${s}`);

async function main() {
  const tent = await prisma.tent.findFirst({ select: { id: true, name: true } });
  if (!tent) throw new Error("No Tents — reseed the Posko first.");

  step(`03 register a Household in ${tent.name} (created by the flow, not seeded)`);
  const proteinBefore = allocationDecision(
    { name: "Susu bubuk", isHighProtein: true },
    (await getTentAllocationView(tent.id))!.composition,
  );
  console.log(
    `     (protein currently ${proteinBefore.allowed ? "allowed" : "refused"} for ${tent.name})`,
  );

  const { id } = await createHousehold({
    name: "TRACER",
    tentId: tent.id,
    residents: [
      { name: "Ibu Tracer", age: 30, nik: "3210000000000001", isPregnant: true, healthStatus: "WELL", chronicConditions: [] },
      { name: "Balita Tracer", age: 2, nik: null, isPregnant: false, healthStatus: "WELL", chronicConditions: [] },
      { name: "Bapak Tracer", age: 34, nik: null, isPregnant: false, healthStatus: "WELL", chronicConditions: [] },
    ],
  });
  check("household created with a random HH- id", /^HH-[A-Z2-9]{6}$/.test(id), id);

  step("04 real Dompet Gizi + real Entitlement");
  const hh = (await getHousehold(id))!;
  check("Dompet Gizi QR payload issued", hh.qrPayload === `posko://dompet-gizi/${id}`);
  check("typed fallback code issued", /^\d{3}-\d{3}$/.test(hh.fallbackCode));
  check("entitlement rolls up to 6050 kcal (pregnant + toddler + adult)", hh.entitlement.kcalPerDay === 6050, String(hh.entitlement.kcalPerDay));

  step("07 allocate stock to that Household's Tent");
  const comp = (await getTentAllocationView(tent.id))!.composition;
  check("tent composition now includes toddler + pregnant (rollup sees the new household)", comp.hasToddler && comp.hasPregnantResident);
  const pool = await listInventoryPool();
  const protein = pool.find((p) => p.name === "Susu bubuk")!;
  const staple = pool.find((p) => p.name === "Beras")!;
  check("protein allocation accepted for the now-qualifying tent",
    (await applyAllocation({ tentId: tent.id, inventoryId: protein.id, quantity: 20, actor: "Koordinator Tracer" })).ok);
  check("staple allocation accepted",
    (await applyAllocation({ tentId: tent.id, inventoryId: staple.id, quantity: 50, actor: "Koordinator Tracer" })).ok);

  step("08 scan THIS household's actual card at distribution");
  check("the card registration wrote resolves at the scanner", (await resolveHousehold(hh.qrPayload)) === id);
  const allocBefore = (await getTentAllocationView(tent.id))!.allocations.find((a) => a.inventoryId === staple.id)!.quantity;
  const logBefore = await prisma.transactionLog.count({ where: { kind: "DISTRIBUTION" } });
  check("distribution accepted", (await recordDistribution({ householdId: id, inventoryId: staple.id, quantity: 8, actor: "Relawan Tracer" })).ok);

  step("→ Tent Allocation decrements and a Transaction Log entry appears");
  const allocAfter = (await getTentAllocationView(tent.id))!.allocations.find((a) => a.inventoryId === staple.id)!.quantity;
  check("tent allocation decremented by 8", allocAfter === allocBefore - 8, `${allocBefore} -> ${allocAfter}`);
  check("a DISTRIBUTION ledger entry appeared", (await prisma.transactionLog.count({ where: { kind: "DISTRIBUTION" } })) === logBefore + 1);

  step("09 Presence for that Household shows the scan (household-level)");
  const presence = await mostRecentPresence(id);
  check("presence derived from the scan", presence !== null && presence.tentName === tent.name);
  check("presence searchable by name", (await searchPresence("TRACER")).some((h) => h.id === id && h.presence !== null));

  step("11 the Tent's Heat reflects the change, with correct Reasons");
  const before = (await getTentHeatDetail(tent.id))!;
  await createComplaint({ residentId: hh.residents.find((r) => r.name === "Bapak Tracer")!.id, symptoms: ["Sesak napas"], source: "VOLUNTEER" });
  const mid = (await getTentHeatDetail(tent.id))!;
  check("an open complaint raises a named Reason", mid.heat.reasons.some((r) => /open complaint at Merah/.test(r)));
  const open = await prisma.complaint.findFirst({ where: { resident: { household: { id } }, resolvedAt: null }, select: { id: true } });
  await confirmComplaint({ complaintId: open!.id, priority: "MERAH", actor: "Koordinator Tracer" });
  const after = (await getTentHeatDetail(tent.id))!;
  check("confirming shifts the Reason (open complaint → active illness)",
    after.heat.reasons.some((r) => /currently sick/.test(r)) && !after.heat.reasons.some((r) => /open complaint at Merah/.test(r)));
  check("Heat is a named list of Reasons, never a bare score", Array.isArray(after.heat.reasons) && !("score" in (after.heat as object)));
  check("Heat Reasons changed across the flow", JSON.stringify(before.heat.reasons) !== JSON.stringify(after.heat.reasons));

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
