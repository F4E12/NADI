import { NextResponse, type NextRequest } from "next/server";
import { recordDeviceSighting } from "@/lib/data/devices";
import { isLaptopAddress, macForIp, roleForIp } from "@/lib/device-role";
import { isResidentRouteAllowed } from "@/lib/resident-access";

export async function proxy(request: NextRequest) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const role = await roleForIp(ip);

  if (ip && !isLaptopAddress(ip)) {
    const bareIp = ip.replace(/^::ffff:/, "");
    await recordDeviceSighting({ ip: bareIp, mac: await macForIp(bareIp) });
  }

  if (role === "RESIDENT" && !isResidentRouteAllowed(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/volunteer-only", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
