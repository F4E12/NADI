import { prisma } from "../lib/db";
import { allocationDecision } from "../lib/rules/allocation";
import {
  householdEntitlement,
  tentEntitlement,
  type Entitlement,
  type ResidentFacts,
} from "../lib/rules/entitlement";

function makeDeterministicRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = makeDeterministicRandom(20260716);

const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const chance = (p: number) => random() < p;

const SURNAMES = [
  "Wijaya", "Santoso", "Halim", "Nasution", "Siregar", "Pratama", "Hutapea",
  "Kusuma", "Ramadhan", "Setiawan", "Lubis", "Simanjuntak", "Anggraini",
  "Purnomo", "Situmorang", "Hidayat", "Maulana", "Sihombing", "Rahayu", "Gunawan",
];

const GIVEN_NAMES = [
  "Budi", "Siti", "Agus", "Dewi", "Eko", "Rina", "Joko", "Ayu", "Bambang",
  "Sri", "Hendra", "Maya", "Rudi", "Lestari", "Andi", "Putri", "Yusuf",
  "Indah", "Rizki", "Fitri", "Dimas", "Nadia", "Arif", "Wulan",
];

const ADULT_CHRONIC_CONDITIONS = ["Asma", "Diabetes", "Hipertensi", "Penyakit jantung"];
const ELDERLY_CHRONIC_CONDITIONS = ["Frailty terkait usia", "Artritis", "Asma", "Hipertensi"];
const CHILD_CHRONIC_CONDITIONS = ["Asma", "Alergi makanan"];

const UNAMBIGUOUS_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomHouseholdId = () =>
  `HH-${Array.from({ length: 6 }, () => UNAMBIGUOUS_ALPHABET[between(0, 31)]).join("")}`;

const typedFallbackCode = () => `${between(100, 999)}-${between(100, 999)}`;

const randomNik = () => Array.from({ length: 16 }, () => between(0, 9)).join("");

const NIK_ISSUING_AGE = 17;
const TODDLER_MAX_AGE = 3;

type SeedResident = ResidentFacts & {
  name: string;
  nik: string | null;
  healthStatus: "WELL" | "SICK" | "RECOVERING";
  chronicConditions: string[];
};

function makeHousehold(surname: string): SeedResident[] {
  const residents: SeedResident[] = [];
  const person = (age: number, over: Partial<SeedResident> = {}): SeedResident => ({
    name: `${pick(GIVEN_NAMES)} ${surname}`,
    age,
    nik: age >= NIK_ISSUING_AGE ? randomNik() : null,
    isPregnant: false,
    healthStatus: chance(0.08) ? "SICK" : chance(0.05) ? "RECOVERING" : "WELL",
    chronicConditions: [],
    ...over,
  });

  const parentAge = between(24, 48);
  const father = person(parentAge + between(0, 4), {
    chronicConditions: chance(0.15) ? [pick(ADULT_CHRONIC_CONDITIONS)] : [],
  });
  const mother = person(parentAge, {
    isPregnant: parentAge < 40 && chance(0.12),
    chronicConditions: chance(0.15) ? [pick(ADULT_CHRONIC_CONDITIONS)] : [],
  });
  residents.push(father, mother);

  const childCount = between(0, 4);
  for (let i = 0; i < childCount; i++) {
    const childAge = between(0, Math.max(1, parentAge - 20));
    residents.push(
      person(childAge, {
        chronicConditions: chance(0.1) ? [pick(CHILD_CHRONIC_CONDITIONS)] : [],
      }),
    );
  }

  if (chance(0.22)) {
    residents.push(
      person(between(65, 84), {
        chronicConditions: [pick(ELDERLY_CHRONIC_CONDITIONS)],
      }),
    );
  }

  return residents;
}

const STOCK_TYPES = [
  { name: "Beras", category: "Makanan pokok", unit: "kg", kcalPerUnit: 3600, isHighProtein: false, shareOfKcal: 0.45 },
  { name: "Mie instan", category: "Makanan pokok", unit: "bungkus", kcalPerUnit: 380, isHighProtein: false, shareOfKcal: 0.2 },
  { name: "Minyak goreng", category: "Makanan pokok", unit: "liter", kcalPerUnit: 8800, isHighProtein: false, shareOfKcal: 0.15 },
  { name: "Susu bubuk", category: "Gizi tinggi protein", unit: "kg", kcalPerUnit: 4900, isHighProtein: true, shareOfKcal: 0.08 },
  { name: "Telur", category: "Gizi tinggi protein", unit: "butir", kcalPerUnit: 70, isHighProtein: true, shareOfKcal: 0.06 },
  { name: "Ikan kaleng", category: "Gizi tinggi protein", unit: "kaleng", kcalPerUnit: 190, isHighProtein: true, shareOfKcal: 0.06 },
  { name: "Air bersih", category: "Air bersih", unit: "liter", kcalPerUnit: 0, isHighProtein: false, shareOfKcal: 0 },
  { name: "Obat demam", category: "Medis", unit: "strip", kcalPerUnit: 0, isHighProtein: false, shareOfKcal: 0 },
];

type StockType = (typeof STOCK_TYPES)[number];

const CLEAN_WATER_CATEGORY = "Air bersih";

const FRACTION_ALREADY_AT_TENTS = 0.6;

const COMPLAINTS = [
  { freeText: "Anak saya demam tinggi sejak semalam dan tidak mau makan", symptoms: ["demam", "nafsu makan menurun"], suggestedPriority: "KUNING" },
  { freeText: "Sesak napas, sudah dua jam, riwayat asma", symptoms: ["sesak napas"], suggestedPriority: "MERAH" },
  { freeText: "Batuk kering dan tenggorokan sakit", symptoms: ["batuk", "sakit tenggorokan"], suggestedPriority: "HIJAU" },
  { freeText: "Diare sejak pagi, sudah lebih dari lima kali", symptoms: ["diare", "dehidrasi"], suggestedPriority: "MERAH" },
  { freeText: "Pusing dan lemas ketika berdiri", symptoms: ["pusing", "lemas"], suggestedPriority: "KUNING" },
  { freeText: "Luka di kaki kena pecahan kaca, sudah dibersihkan", symptoms: ["luka terbuka"], suggestedPriority: "HIJAU" },
  { freeText: "Nyeri dada dan keringat dingin", symptoms: ["nyeri dada", "keringat dingin"], suggestedPriority: "MERAH" },
  { freeText: "Gatal-gatal di lengan setelah kena air banjir", symptoms: ["ruam kulit"], suggestedPriority: "HIJAU" },
];

const TENTS = [
  { name: "Tenda A", maxCapacity: 80, occupancyTarget: 0.95 },
  { name: "Tenda B", maxCapacity: 80, occupancyTarget: 0.5 },
  { name: "Tenda C", maxCapacity: 100, occupancyTarget: 0.75 },
  { name: "Tenda D", maxCapacity: 100, occupancyTarget: 0.35 },
  { name: "Tenda E", maxCapacity: 120, occupancyTarget: 0.9 },
  { name: "Tenda F", maxCapacity: 120, occupancyTarget: 0.6 },
  { name: "Tenda G", maxCapacity: 140, occupancyTarget: 0.45 },
  { name: "Tenda H", maxCapacity: 140, occupancyTarget: 0.8 },
  { name: "Tenda J", maxCapacity: 100, occupancyTarget: 0.7 },
  { name: "Tenda K", maxCapacity: 120, occupancyTarget: 0.85 },
  { name: "Tenda L", maxCapacity: 150, occupancyTarget: 0.65 },
  { name: "Tenda M", maxCapacity: 150, occupancyTarget: 0.9 },
];

const QUALIFIES_FOR_PROTEIN_TENT_INDEX = 0;
const NO_PROTEIN_TENT_INDEX = 3;
const NEARLY_DRY_TENT_INDEX = 3;

const NEARLY_DRY_DAYS_OF_COVER = 0.5;

const TARGET_RESIDENTS = 1000;
const COORDINATOR = "Koordinator Sari";

type PlannedAllocation = { tentId: string; stockName: string; quantity: number };

async function main() {
  console.log("Seeding a Posko already mid-operation…");

  const existing = await prisma.household.count();
  if (existing > 0) {
    throw new Error(
      "This Posko already holds data. Delete prisma/posko.db and rerun `npm run db:setup` — the Transaction Log cannot be cleared in place.",
    );
  }

  const tents = await Promise.all(
    TENTS.map(({ name, maxCapacity }) =>
      prisma.tent.create({ data: { name, maxCapacity } }),
    ),
  );

  const { residentsCreated, householdsCreated } = await seedHouseholds(tents);

  await ensureCompositionContrast(
    tents[QUALIFIES_FOR_PROTEIN_TENT_INDEX].id,
    tents[NO_PROTEIN_TENT_INDEX].id,
  );

  const planned = await planAllocations(tents);
  const stock = await seedStockHoldingBackAReserve(planned);
  await recordAllocations(planned, stock);
  await seedComplaints();

  console.log(
    `Seeded ${residentsCreated} residents in ${householdsCreated} households across ${tents.length} tents, ` +
      `${stock.size} inventory items, and ${COMPLAINTS.length} complaints.`,
  );
}

async function seedHouseholds(tents: { id: string; maxCapacity: number }[]) {
  const roomLeft = tents.map((tent, i) =>
    Math.round(tent.maxCapacity * TENTS[i].occupancyTarget),
  );

  let residentsCreated = 0;
  let householdsCreated = 0;

  while (residentsCreated < TARGET_RESIDENTS) {
    const surname = pick(SURNAMES);
    const residents = makeHousehold(surname);

    const tentIndex = roomLeft.indexOf(Math.max(...roomLeft));
    if (roomLeft[tentIndex] < residents.length) break;
    roomLeft[tentIndex] -= residents.length;

    const id = randomHouseholdId();
    await prisma.household.create({
      data: {
        id,
        name: surname,
        qrPayload: `posko://dompet-gizi/${id}`,
        fallbackCode: typedFallbackCode(),
        tentId: tents[tentIndex].id,
        residents: {
          create: residents.map((resident) => ({
            name: resident.name,
            age: resident.age,
            nik: resident.nik,
            isPregnant: resident.isPregnant,
            healthStatus: resident.healthStatus,
            chronicConditions: {
              create: resident.chronicConditions.map((name) => ({ name })),
            },
          })),
        },
      },
    });

    residentsCreated += residents.length;
    householdsCreated += 1;
  }

  return { residentsCreated, householdsCreated };
}

async function planAllocations(tents: { id: string }[]): Promise<PlannedAllocation[]> {
  const planned: PlannedAllocation[] = [];

  for (const [index, tent] of tents.entries()) {
    const requirement = await tentRequirement(tent.id);
    const composition = await tentComposition(tent.id);
    const targetDaysOfCover =
      index === NEARLY_DRY_TENT_INDEX ? NEARLY_DRY_DAYS_OF_COVER : between(3, 6);

    const permitted = STOCK_TYPES.filter(
      (stock) => allocationDecision(stock, composition).allowed,
    );
    const permittedShareOfKcal = permitted.reduce(
      (sum, stock) => sum + stock.shareOfKcal,
      0,
    );

    for (const stock of permitted) {
      const quantity = quantityForDaysOfCover(stock, {
        requirement,
        targetDaysOfCover,
        permittedShareOfKcal,
      });
      if (quantity > 0) {
        planned.push({ tentId: tent.id, stockName: stock.name, quantity });
      }
    }
  }

  return planned;
}

async function seedStockHoldingBackAReserve(planned: PlannedAllocation[]) {
  const stock = await Promise.all(
    STOCK_TYPES.map((type) => {
      const alreadyAtTents = planned
        .filter((p) => p.stockName === type.name)
        .reduce((sum, p) => sum + p.quantity, 0);
      const heldCentrally =
        Math.round(alreadyAtTents / FRACTION_ALREADY_AT_TENTS) - alreadyAtTents;

      return prisma.inventory.create({
        data: {
          name: type.name,
          category: type.category,
          unit: type.unit,
          kcalPerUnit: type.kcalPerUnit,
          isHighProtein: type.isHighProtein,
          quantity: heldCentrally,
        },
      });
    }),
  );

  return new Map(stock.map((item) => [item.name, item]));
}

async function recordAllocations(
  planned: PlannedAllocation[],
  stock: Map<string, { id: string }>,
) {
  for (const { tentId, stockName, quantity } of planned) {
    const allocation = await prisma.tentAllocation.create({
      data: { tentId, inventoryId: stock.get(stockName)!.id, quantity },
    });
    await prisma.transactionLog.create({
      data: {
        kind: "ALLOCATION",
        quantity,
        actor: COORDINATOR,
        allocationId: allocation.id,
      },
    });
  }
}

async function seedComplaints() {
  const residents = await prisma.resident.findMany({
    take: COMPLAINTS.length,
    orderBy: { id: "asc" },
    select: { id: true },
  });

  await Promise.all(
    COMPLAINTS.map((complaint, i) => {
      const isConfirmed = i % 2 === 0;
      return prisma.complaint.create({
        data: {
          freeText: complaint.freeText,
          symptoms: JSON.stringify(complaint.symptoms),
          suggestedPriority: complaint.suggestedPriority,
          confirmedPriority: isConfirmed ? complaint.suggestedPriority : null,
          confirmedBy: isConfirmed ? COORDINATOR : null,
          residentId: residents[i].id,
        },
      });
    }),
  );
}

function quantityForDaysOfCover(
  stock: StockType,
  context: {
    requirement: Entitlement;
    targetDaysOfCover: number;
    permittedShareOfKcal: number;
  },
): number {
  const { requirement, targetDaysOfCover, permittedShareOfKcal } = context;

  if (stock.category === CLEAN_WATER_CATEGORY) {
    return Math.round(requirement.cleanWaterLitresPerDay * targetDaysOfCover);
  }
  if (stock.kcalPerUnit === 0) {
    return between(5, 20);
  }

  const share =
    permittedShareOfKcal === 0 ? 0 : stock.shareOfKcal / permittedShareOfKcal;
  const kcal = requirement.kcalPerDay * targetDaysOfCover * share;

  return Math.max(1, Math.round(kcal / stock.kcalPerUnit));
}

async function tentRequirement(tentId: string): Promise<Entitlement> {
  const households = await prisma.household.findMany({
    where: { tentId },
    select: { residents: { select: { age: true, isPregnant: true } } },
  });

  return tentEntitlement(
    households.map((household) => householdEntitlement(household.residents)),
  );
}

async function tentComposition(tentId: string) {
  const [toddlers, pregnant] = await Promise.all([
    prisma.resident.count({
      where: { household: { tentId }, age: { lte: TODDLER_MAX_AGE } },
    }),
    prisma.resident.count({ where: { household: { tentId }, isPregnant: true } }),
  ]);

  return { hasToddler: toddlers > 0, hasPregnantResident: pregnant > 0 };
}

async function ensureCompositionContrast(qualifyingTentId: string, plainTentId: string) {
  const someone = await prisma.resident.findFirst({
    where: { household: { tentId: qualifyingTentId } },
  });
  if (someone) {
    await prisma.resident.update({
      where: { id: someone.id },
      data: { age: 2, isPregnant: false, nik: null },
    });
  }

  await prisma.resident.updateMany({
    where: { household: { tentId: plainTentId }, age: { lte: TODDLER_MAX_AGE } },
    data: { age: 8 },
  });
  await prisma.resident.updateMany({
    where: { household: { tentId: plainTentId }, isPregnant: true },
    data: { isPregnant: false },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
