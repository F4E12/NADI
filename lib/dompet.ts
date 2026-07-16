const UNAMBIGUOUS_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const HOUSEHOLD_ID_LENGTH = 6;

const randInt = (max: number) => Math.floor(Math.random() * max);

export function randomHouseholdId(): string {
  const body = Array.from(
    { length: HOUSEHOLD_ID_LENGTH },
    () => UNAMBIGUOUS_ALPHABET[randInt(UNAMBIGUOUS_ALPHABET.length)],
  ).join("");
  return `HH-${body}`;
}

export function typedFallbackCode(): string {
  return `${100 + randInt(900)}-${100 + randInt(900)}`;
}

export function qrPayloadFor(householdId: string): string {
  return `posko://dompet-gizi/${householdId}`;
}

export type DompetGizi = {
  householdId: string;
  qrPayload: string;
  fallbackCode: string;
};

export function issueDompetGizi(): DompetGizi {
  const householdId = randomHouseholdId();
  return {
    householdId,
    qrPayload: qrPayloadFor(householdId),
    fallbackCode: typedFallbackCode(),
  };
}
