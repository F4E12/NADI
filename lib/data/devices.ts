import { prisma } from "@/lib/db";
import { isValidMac, normalizeMac } from "@/lib/device-role";

export type RegisteredDevice = {
  id: string;
  mac: string;
  label: string | null;
  registeredAt: Date;
};

export type DeviceSighting = {
  ip: string;
  mac: string | null;
  lastSeenAt: Date;
};

export async function listDevices(): Promise<RegisteredDevice[]> {
  return prisma.device.findMany({ orderBy: { registeredAt: "desc" } });
}

export async function recordDeviceSighting(input: {
  ip: string;
  mac: string | null;
}): Promise<void> {
  await prisma.deviceSighting.upsert({
    where: { ip: input.ip },
    update: { mac: input.mac, lastSeenAt: new Date() },
    create: { ip: input.ip, mac: input.mac },
  });
}

export async function listRecentDeviceSightings(
  since = new Date(Date.now() - 10 * 60_000),
): Promise<DeviceSighting[]> {
  return prisma.deviceSighting.findMany({
    where: { lastSeenAt: { gte: since } },
    orderBy: { lastSeenAt: "desc" },
  });
}

export async function registerDevice(input: {
  mac: string;
  label?: string;
}): Promise<RegisteredDevice> {
  if (!isValidMac(input.mac)) throw new Error("Alamat MAC tidak valid");
  const mac = normalizeMac(input.mac);
  const label = input.label?.trim() || null;
  return prisma.device.upsert({
    where: { mac },
    update: { label },
    create: { mac, label },
  });
}

export async function revokeDevice(id: string): Promise<void> {
  await prisma.device.delete({ where: { id } });
}
