import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { lanAddresses } from "@/lib/network";

const exec = promisify(execFile);

export type DeviceRole = "VOLUNTEER" | "RESIDENT";

const ARP_TTL_MS = 15_000;
const arpCache = new Map<string, { mac: string | null; at: number }>();

export function normalizeMac(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replaceAll("-", ":")
    .split(":")
    .map((octet) => octet.padStart(2, "0"))
    .join(":");
}

export function isValidMac(raw: string): boolean {
  return /^([0-9a-f]{1,2}[:-]){5}[0-9a-f]{1,2}$/i.test(raw.trim());
}

const ARP_LINE = /\(([\d.]+)\) at ([0-9a-f:]+) on/i;

export async function macForIp(ip: string): Promise<string | null> {
  const cached = arpCache.get(ip);
  if (cached && Date.now() - cached.at < ARP_TTL_MS) return cached.mac;

  let mac: string | null = null;
  try {
    const { stdout } = await exec("arp", ["-n", ip]);
    const match = stdout.match(ARP_LINE);
    if (match) mac = normalizeMac(match[2]);
  } catch {
    mac = null;
  }

  arpCache.set(ip, { mac, at: Date.now() });
  return mac;
}

export type ArpNeighbour = { ip: string; mac: string };

export async function arpNeighbourhood(): Promise<ArpNeighbour[]> {
  try {
    const { stdout } = await exec("arp", ["-an"]);
    const out: ArpNeighbour[] = [];
    for (const line of stdout.split("\n")) {
      const match = line.match(ARP_LINE);
      if (match) out.push({ ip: match[1], mac: normalizeMac(match[2]) });
    }
    return out;
  } catch {
    return [];
  }
}

export function isLaptopAddress(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") return true;
  const bare = ip.replace(/^::ffff:/, "");
  if (bare === "127.0.0.1") return true;
  return lanAddresses().some((a) => a.ip === bare);
}

export async function roleForIp(ip: string): Promise<DeviceRole> {
  if (!ip) return "RESIDENT";
  if (isLaptopAddress(ip)) return "VOLUNTEER";

  const mac = await macForIp(ip.replace(/^::ffff:/, ""));
  if (!mac) return "RESIDENT";

  const device = await prisma.device.findUnique({ where: { mac } });
  return device ? "VOLUNTEER" : "RESIDENT";
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim();
}

export async function deviceRole(): Promise<DeviceRole> {
  return roleForIp(await clientIp());
}

export async function requireVolunteer(): Promise<void> {
  if ((await deviceRole()) !== "VOLUNTEER") {
    throw new Error("Aksi ini khusus perangkat Volunteer");
  }
}

export async function requireLaptop(): Promise<boolean> {
  return isLaptopAddress(await clientIp());
}
