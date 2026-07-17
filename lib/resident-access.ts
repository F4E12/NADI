const RESIDENT_PREFIXES = [
  "/board",
  "/heat",
  "/presence",
  "/complaints",
  "/register",
  "/volunteer-only",
];

export function isResidentRouteAllowed(path: string): boolean {
  if (path === "/") return true;
  return RESIDENT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
