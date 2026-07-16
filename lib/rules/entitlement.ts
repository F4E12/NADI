export type ResidentFacts = {
  age: number;
  isPregnant: boolean;
};

export type Entitlement = {
  kcalPerDay: number;
  cleanWaterLitresPerDay: number;
};

const AKG_BY_AGE_BAND: ReadonlyArray<{ maxAge: number; kcal: number }> = [
  { maxAge: 0, kcal: 550 },
  { maxAge: 3, kcal: 1350 },
  { maxAge: 9, kcal: 1600 },
  { maxAge: 18, kcal: 2100 },
  { maxAge: 64, kcal: 2200 },
  { maxAge: Infinity, kcal: 1800 },
];

const PREGNANCY_KCAL = 300;

const SPHERE_MINIMUM_CLEAN_WATER_LITRES = 15;

const NOTHING_OWED: Entitlement = { kcalPerDay: 0, cleanWaterLitresPerDay: 0 };

export function residentEntitlement(resident: ResidentFacts): Entitlement {
  const band = AKG_BY_AGE_BAND.find((b) => resident.age <= b.maxAge)!;

  return {
    kcalPerDay: band.kcal + (resident.isPregnant ? PREGNANCY_KCAL : 0),
    cleanWaterLitresPerDay: SPHERE_MINIMUM_CLEAN_WATER_LITRES,
  };
}

export function householdEntitlement(residents: ResidentFacts[]): Entitlement {
  return sumEntitlements(residents.map(residentEntitlement));
}

export function tentEntitlement(households: Entitlement[]): Entitlement {
  return sumEntitlements(households);
}

function sumEntitlements(entitlements: Entitlement[]): Entitlement {
  return entitlements.reduce(
    (total, next) => ({
      kcalPerDay: total.kcalPerDay + next.kcalPerDay,
      cleanWaterLitresPerDay:
        total.cleanWaterLitresPerDay + next.cleanWaterLitresPerDay,
    }),
    NOTHING_OWED,
  );
}
