import { prisma } from "@/lib/db";
import { normalizeMac } from "@/lib/device-role";

export type RegisteredDevice = {
  id: string;
  mac: string;
  label: string | null;
  registeredAt: Date;
};

export async function listDevices(): Promise<RegisteredDevice[]> {
  return prisma.device.findMany({ orderBy: { registeredAt: "desc" } });
}

export async function registerDevice(input: {
  mac: string;
  label?: string;
}): Promise<RegisteredDevice> {
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
