import { NextResponse, type NextRequest } from "next/server";
import { roleForIp } from "@/lib/device-role";

const RESIDENT_PREFIXES = [
  "/board",
  "/heat",
  "/presence",
  "/complaints",
  "/volunteer-only",
];

function residentAllowed(path: string): boolean {
  if (path === "/") return true;
  return RESIDENT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const role = await roleForIp(ip);

  if (role === "RESIDENT" && !residentAllowed(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/volunteer-only", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
