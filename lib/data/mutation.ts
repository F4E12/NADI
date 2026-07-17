export type MutationResult =
  | { ok: true }
  | { ok: false; error: string };

export function normalizedName(name: string): string {
  return name.trim().toLocaleLowerCase("id-ID");
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
